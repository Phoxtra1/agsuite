import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AminevaImpactPage from "../pages/landing/AminevaImpactPage";
import CareerDevelopmentPage from "../pages/landing/CareerDevelopmentPage";

class TestIntersectionObserver {
  root: Element | null = null;
  rootMargin = "0px";
  thresholds: number[] = [];
  constructor(_callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

beforeEach(() => vi.stubGlobal("IntersectionObserver", TestIntersectionObserver));
afterEach(() => vi.unstubAllGlobals());

describe("Amineva Impact public routes", () => {
  it("renders the Impact overview and its current primary sections", () => {
    render(
      <MemoryRouter initialEntries={["/impact"]}>
        <Routes>
          <Route path="/impact" element={<AminevaImpactPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Amineva Impact/i, level: 1 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Our Focus Areas/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /What we work to achieve/i })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Explore the Career Development and Exploration Program/i })
    ).toBeTruthy();
  });

  it("renders the dedicated Career Development and Exploration programme route", () => {
    render(
      <MemoryRouter initialEntries={["/impact/career-development"]}>
        <Routes>
          <Route path="/impact/career-development" element={<CareerDevelopmentPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: /Career Development and Exploration Program/i,
        level: 1,
      })
    ).toBeTruthy();
    expect(screen.getByText(/More than 600 learners/i)).toBeTruthy();
  });
});
