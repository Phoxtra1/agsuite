import { describe, expect, it } from "vitest";
import { cleanModelJson, isExactISODate, isHttpUrl, publisherFromUrl } from "../../supabase/functions/docs-intelligence/historicalEvents";

describe("Supabase historical event helpers", () => {
  it("accepts exact valid ISO dates and rejects invalid calendar dates", () => {
    expect(isExactISODate("1957-03-06")).toBe(true);
    expect(isExactISODate("2000-02-29")).toBe(true);
    expect(isExactISODate("2026-02-30")).toBe(false);
    expect(isExactISODate("06-03-1957")).toBe(false);
  });

  it("removes optional Markdown JSON fences before parsing", () => {
    expect(cleanModelJson('```json\n{"events":[]}\n```')).toBe('{"events":[]}');
  });

  it("accepts only absolute HTTP and HTTPS source links", () => {
    expect(isHttpUrl("https://archives.example.org/item/1")).toBe(true);
    expect(isHttpUrl("http://example.org")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("not-a-url")).toBe(false);
  });

  it("normalises publisher hostnames without the www prefix", () => {
    expect(publisherFromUrl("https://www.archives.example.org/report")).toBe("archives.example.org");
  });
});
