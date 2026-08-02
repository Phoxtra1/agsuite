import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFolder, listFolder, uploadFile, trashItem, restoreItem, purgeItem, storageUsage } from "@/lib/workspace/drive/documents";

describe("Amineva Drive storage service test suite", () => {
  beforeEach(() => {
    // Clear mock localStorage on each run
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("should be able to create a folder and list it", async () => {
    const fld = await createFolder("Engineering Logs", null, "blue", "System operations logs");
    expect(fld).not.toBeNull();
    expect(fld?.name).toBe("Engineering Logs");
    expect(fld?.color).toBe("blue");

    const list = await listFolder(null);
    expect(list.folders.length).toBe(1);
    expect(list.folders[0].name).toBe("Engineering Logs");
  });

  it("should be able to upload a file and calculate storage usage", async () => {
    const mockFile = {
      name: "financial-report.pdf",
      size: 50 * 1024, // 50 KB
      type: "application/pdf"
    };

    const uploaded = await uploadFile(mockFile, null);
    expect(uploaded).not.toBeNull();
    expect(uploaded?.name).toBe("financial-report.pdf");

    const usage = await storageUsage();
    expect(usage.used).toBe(50 * 1024);
  });

  it("should support complete soft delete (trash) and restore lifecycle", async () => {
    const mockFile = {
      name: "old-doc.txt",
      size: 1024,
      type: "text/plain"
    };

    const uploaded = await uploadFile(mockFile, null);
    expect(uploaded).not.toBeNull();

    // Check active files list
    let list = await listFolder(null);
    expect(list.files.length).toBe(1);

    // Trash
    await trashItem(uploaded!.id, "file");
    list = await listFolder(null);
    expect(list.files.length).toBe(0);

    // Restore
    await restoreItem(uploaded!.id, "file");
    list = await listFolder(null);
    expect(list.files.length).toBe(1);

    // Permanent Delete (Purge)
    await purgeItem(uploaded!.id, "file");
    list = await listFolder(null);
    expect(list.files.length).toBe(0);
  });
});
