import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchCategoryProducts,
  fetchAdminProducts,
  upsertProduct,
  deleteProduct,
} from "@/data/products";
import type { ProductData } from "@/types/product";

describe("Product Category Saving & Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("permanently saves edits to a category product and preserves them across fetchCategoryProducts", async () => {
    const updatedProduct: ProductData = {
      id: "datalens",
      name: "DataLens Advanced Services",
      shortName: "DataLens Intel",
      description: "Comprehensive IT and Data Solutions for Enterprise",
      url: "https://datalens.amineva.com",
      category: "data-intelligence",
      status: "live",
      order: 1,
      isPublic: true,
    };

    const saved = await upsertProduct(updatedProduct, "category");
    expect(saved).toBe(true);

    const products = await fetchCategoryProducts();
    const target = products.find((p) => p.id === "datalens");

    expect(target).toBeDefined();
    expect(target?.name).toBe("DataLens Advanced Services");
    expect(target?.description).toBe("Comprehensive IT and Data Solutions for Enterprise");
    expect(target?.status).toBe("live");
  });

  it("ensures outdated server data does not overwrite saved local edits", async () => {
    const edit: ProductData = {
      id: "aminevaops",
      name: "Sikasɛm Operations Hub",
      shortName: "Sikasɛm",
      description: "Updated financial operations portal",
      url: "https://ops.amineva.com",
      category: "financial-operations",
      status: "offline",
      order: 2,
      isPublic: true,
    };

    await upsertProduct(edit, "category");

    // Simulate fetchCategoryProducts running after database fetch
    const fetched = await fetchCategoryProducts();
    const item = fetched.find((p) => p.id === "aminevaops");

    expect(item?.name).toBe("Sikasɛm Operations Hub");
    expect(item?.description).toBe("Updated financial operations portal");
    expect(item?.status).toBe("offline");
  });
});
