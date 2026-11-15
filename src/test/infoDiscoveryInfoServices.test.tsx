import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import InfoDiscoveryPage from "../pages/landing/InfoDiscoveryPage";

describe("Info Discovery Info Services area", () => {
  it("renders the Info Services explainer and links to the main Info Services site", () => {
    render(
      <MemoryRouter initialEntries={["/info-discovery/it-innovation"]}>
        <Routes>
          <Route path="/info-discovery/:categorySlug" element={<InfoDiscoveryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Information for Better Decisions/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Our Info Services/i })).toBeTruthy();

    const destination = screen.getByRole("link", { name: /Visit Info Services/i });
    expect(destination.getAttribute("href")).toBe("https://info.amineva.com/");
    expect(screen.getByRole("heading", { name: /Info and Reports Verification/i })).toBeTruthy();
  });
});
