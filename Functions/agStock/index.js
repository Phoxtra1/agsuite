import { Client, Databases, Users, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);
    const users = new Users(client);

    // Require authentication
    if (!req.headers["x-appwrite-user-id"]) {
      return res.json({ error: "Unauthorized" }, 401);
    }

    const userId = req.headers["x-appwrite-user-id"];
    const user = await users.get(userId);

    // Optional: enforce Stock access via Suite
    const access = await db.listDocuments(
      process.env.SUITE_DB_ID,
      process.env.SUITE_USER_ACCESS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("moduleSlug", "ag-stock")]
    );

    if (!access.documents.length || access.documents[0].access !== "allowed") {
      return res.json({ error: "Stock access denied" }, 403);
    }

    // Fetch stock products
    const products = await db.listDocuments(
      process.env.STOCK_DB_ID,
      process.env.STOCK_PRODUCTS_COLLECTION_ID,
      [Query.orderAsc("name")]
    );

    return res.json({
      user: {
        id: user.$id,
        email: user.email,
        name: user.name
      },
      products: products.documents
    });
  } catch (err) {
    error(err);
    return res.json({ error: "Stock function failed" }, 500);
  }
};
