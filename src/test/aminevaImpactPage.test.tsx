import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: /Our active programme/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Purpose that starts with people/i })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Explore the active programme/i })
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Our Focus Areas/i })).toBeNull();
    expect(screen.queryByText(/Youth Empowerment and Skills Development/i)).toBeNull();
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
    const featuredPhotographs = screen.getAllByRole("img", {
      name: /Learners participating in a school-based career development programme/i,
    });
    expect(featuredPhotographs[0].getAttribute("src")).toBe("/saleria1.jpg");
    expect(screen.queryByRole("button", { name: /Next photograph/i })).toBeNull();

    expect(screen.getByRole("tab", { name: /Discover strengths/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Explore possibilities/i }));
    expect(screen.getByRole("tabpanel").textContent).toContain(
      "Make the world of work feel wider."
    );
  });
});
