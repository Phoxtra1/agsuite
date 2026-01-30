import express from "express";

const router = express.Router();

/**
 * POST /api/employee/pin
 * Body: { token, pin }
 */
router.post("/pin", async (req, res) => {
  try {
    const { token, pin } = req.body;

    if (!token || !pin) {
      return res.status(400).json({ error: "Missing token or pin" });
    }

    // TODO:
    // Later you will:
    // - validate token
    // - hash pin
    // - save pin to database

    return res.json({
      success: true,
      message: "PIN set successfully"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
