import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Amineva Leta Font Integration", () => {
  it("should have all font files generated in public/fonts/amineva-leta", () => {
    const fontDir = path.join(process.cwd(), "public", "fonts", "amineva-leta");
    expect(fs.existsSync(fontDir)).toBe(true);

    const weights = ["Light", "Regular", "Medium", "SemiBold", "Bold"];
    for (const w of weights) {
      expect(fs.existsSync(path.join(fontDir, `AminevaLeta-${w}.ttf`))).toBe(true);
      expect(fs.existsSync(path.join(fontDir, `AminevaLeta-${w}.woff`))).toBe(true);
      expect(fs.existsSync(path.join(fontDir, `AminevaLeta-${w}.woff2`))).toBe(true);
    }
  });

  it("should include Amineva Leta in index.css @font-face declarations", () => {
    const cssPath = path.join(process.cwd(), "src", "index.css");
    const content = fs.readFileSync(cssPath, "utf-8");
    expect(content).toContain("@font-face");
    expect(content).toContain("Amineva Leta");
    expect(content).toContain("font-family: 'Amineva Leta'");
    expect(content).toContain('font-family: "Amineva Leta", "Inter"');
  });

  it("should specify Amineva Leta as first font in Tailwind config", () => {
    const configPath = path.join(process.cwd(), "tailwind.config.ts");
    const content = fs.readFileSync(configPath, "utf-8");
    expect(content).toContain('"Amineva Leta"');
  });
});
