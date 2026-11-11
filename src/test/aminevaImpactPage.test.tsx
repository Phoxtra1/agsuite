import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AminevaImpactPage from "../pages/landing/AminevaImpactPage";

describe("Amineva Impact public route", () => {
  it("renders the page and its primary sections without a route error", () => {
    render(
      <MemoryRouter initialEntries={["/impact"]}>
        <Routes>
          <Route path="/impact" element={<AminevaImpactPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Amineva Impact/i, level: 1 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Our Focus Areas/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /All Amineva Impact Initiatives/i })).toBeTruthy();
  });

  it("renders the career development initiative deep link", () => {
    render(
      <MemoryRouter initialEntries={["/impact/career-development"]}>
        <Routes>
          <Route path="/impact/:initiativeId" element={<AminevaImpactPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Amineva Impact/i, level: 1 })).toBeTruthy();
    expect(screen.getAllByText(/Career Development & Exploration Initiative/i).length).toBeGreaterThan(0);
  });
});
