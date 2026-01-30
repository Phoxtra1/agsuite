import crypto from "crypto";

export async function setEmployeePin(req, res) {
  try {
    const { token, pin } = req.body;

    if (!token || !pin) {
      return res.status(400).json({ error: "Token and PIN required" });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 4 digits" });
    }

    const hash = crypto
      .createHash("sha256")
      .update(pin)
      .digest("hex");

    // TODO: Replace with real DB write
    global.employeePins = global.employeePins || {};
    global.employeePins[token] = hash;

    return res.json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "PIN setup failed" });
  }
}
