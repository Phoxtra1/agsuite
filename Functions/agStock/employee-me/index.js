export default async ({ req, res }) => {
  try {
    // Normally you would read session user here
    // For now we simulate permissions

    const permissions = [
      "stock.in",
      "stock.out",
      "sales.create"
    ];

    return res.json({
      permissions
    });

  } catch (err) {
    return res.json({ error: "Unauthorized" }, 401);
  }
};
