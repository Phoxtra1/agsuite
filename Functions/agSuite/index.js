import { Client, Databases, Users, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Appwrite server SDK
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);
    const users = new Users(client);

    // Only allow authenticated users
    if (!req.headers["x-appwrite-user-id"]) {
      return res.json({ error: "Unauthorized" }, 401);
    }

    const userId = req.headers["x-appwrite-user-id"];

    // Get user profile
    const user = await users.get(userId);

    // Load all suite modules
    const modules = await db.listDocuments(
      process.env.SUITE_DB_ID,
      process.env.SUITE_MODULES_COLLECTION_ID,
      [Query.equal("isVisible", true), Query.orderAsc("sortOrder")]
    );

    // Load this user's access rights
    const access = await db.listDocuments(
      process.env.SUITE_DB_ID,
      process.env.SUITE_USER_ACCESS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );

    const accessMap = {};
    access.documents.forEach((a) => {
      accessMap[a.moduleSlug] = a.access;
    });

    // Merge permissions into modules
    const result = modules.documents.map((m) => ({
      id: m.$id,
      name: m.name,
      slug: m.slug,
      status: m.status,
      launchUrl: m.launchUrl,
      allowed: accessMap[m.slug] === "allowed",
    }));

    return res.json({
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
      modules: result,
    });
  } catch (err) {
    error(err);
    return res.json({ error: "Suite function failed" }, 500);
  }
};
