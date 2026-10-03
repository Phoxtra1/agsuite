import { describe, it, expect, beforeEach } from "vitest";
import {
  createAdminCredential,
  verifyAdminCredentials,
  getSealSession,
  clearSealSession,
} from "../sealAuth";

describe("Seal Authentication", () => {
  beforeEach(() => {
    clearSealSession();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should create admin credentials and verify successfully", async () => {
    const createRes = await createAdminCredential("System Administrator", "7849");
    expect(createRes.success).toBe(true);
    expect(createRes.credential).toBeDefined();
    expect(createRes.credential?.id).toMatch(/^(SM-|AMV-)/);

    const adminId = createRes.credential!.id;
    const recoveryId = createRes.credential!.recoveryId;

    // Verify correct Admin ID and PIN
    const verifyRes = await verifyAdminCredentials(adminId, "7849");
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.credential?.id).toBe(adminId);

    const session = getSealSession();
    expect(session).not.toBeNull();
    expect(session?.id).toBe(adminId);

    clearSealSession();

    // Verify correct Recovery ID and PIN
    const verifyRecoveryRes = await verifyAdminCredentials(recoveryId, "7849");
    expect(verifyRecoveryRes.success).toBe(true);

    // Verify incorrect PIN fails
    clearSealSession();
    const wrongPinRes = await verifyAdminCredentials(adminId, "0000");
    expect(wrongPinRes.success).toBe(false);
    expect(wrongPinRes.error).toBe("Incorrect PIN.");

    // Verify unknown ID fails
    const unknownIdRes = await verifyAdminCredentials("AMV-UNKNOWN-99", "7849");
    expect(unknownIdRes.success).toBe(false);
    expect(unknownIdRes.error).toBe("Unrecognised Admin ID.");
  });
});
