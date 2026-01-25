import Stripe from "stripe";
import { Client, Databases } from "node-appwrite";

export default async ({ req, res }) => {
  try {
    const path = req.path || "";

    // -------------------------
    // STRIPE CHECKOUT
    // -------------------------
    if (path === "/stripe/checkout") {
      const body = JSON.parse(req.body || "{}");
      const { planKey } = body;

      const PLANS = {
        BASIC: { priceId: "price_basic", maxProducts: 450 },
        STANDARD: { priceId: "price_standard", maxProducts: 1000 },
        PREMIUM: { priceId: "price_premium", maxProducts: 2000 },
      };

      const plan = PLANS[planKey];
      if (!plan) return res.json({ error: "Invalid plan" }, 400);

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: plan.priceId, quantity: 1 }],
        metadata: {
          shopId: req.headers["x-shop-id"],
          planKey,
          maxProducts: plan.maxProducts,
        },
        success_url: `${process.env.APP_URL}/shop/subscription?success=true`,
        cancel_url: `${process.env.APP_URL}/shop/subscription?cancelled=true`,
      });

      return res.json({ url: session.url });
    }

    // -------------------------
    // STRIPE WEBHOOK
    // -------------------------
    if (path === "/stripe/webhook") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const sig = req.headers["stripe-signature"];

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { shopId, planKey, maxProducts } = session.metadata;

        const client = new Client()
          .setEndpoint(process.env.APPWRITE_ENDPOINT)
          .setProject(process.env.APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);

        const db = new Databases(client);

        await db.updateDocument(
          process.env.DB_ID,
          "shops",
          shopId,
          {
            subscriptionStatus: "ACTIVE",
            planKey,
            maxProducts: Number(maxProducts),
          }
        );
      }

      return res.json({ received: true });
    }

    // -------------------------
    // BANK TRANSFER
    // -------------------------
    if (path === "/bank-transfer") {
      const body = JSON.parse(req.body || "{}");

      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const db = new Databases(client);

      await db.createDocument(
        process.env.DB_ID,
        "bank_transfers",
        "unique()",
        {
          shopId: body.shopId,
          proofFileId: body.fileId,
          status: "PENDING_VERIFICATION",
          createdAt: new Date().toISOString(),
        }
      );

      return res.json({ success: true });
    }

    return res.json({ error: "Unknown route" }, 404);
  } catch (err) {
    console.error(err);
    return res.json({ error: "Function error" }, 500);
  }
};
