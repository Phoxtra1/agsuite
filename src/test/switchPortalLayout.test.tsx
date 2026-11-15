import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Landing from "@/pages/landing/Landing";
import PortalLayout from "@/components/portal/PortalLayout";

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { email: "billing@example.com" },
  }),
}));

vi.mock("@/hooks/useVisitorLocation", () => ({
  useVisitorLocation: () => ({ locationLabel: "Accra, Ghana" }),
}));

describe("Amineva Switch portal layout", () => {
  it("shows the portal navigation without rendering the homepage navigation a second time", () => {
    render(
      <MemoryRouter initialEntries={["/switch"]}>
        <Routes>
          <Route path="/" element={<Landing />}>
            <Route
              path="switch"
              element={<PortalLayout><div>Switch page content</div></PortalLayout>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Your Amineva portal" })).toBeInTheDocument();
    expect(screen.getByText("Switch page content")).toBeInTheDocument();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
  });
});
