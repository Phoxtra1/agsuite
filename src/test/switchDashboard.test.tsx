import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SwitchDashboard from "@/pages/landing/SwitchDashboard";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "billing@example.com" } }),
}));

const renderDashboard = () => render(<MemoryRouter><SwitchDashboard /></MemoryRouter>);

describe("Amineva Switch dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the account dashboard and makes the three billing views accessible", () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Amineva Switch" })).toBeInTheDocument();
    expect(screen.getByText("billing@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Application billing feeds are not connected yet" })).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /invoices/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /subscriptions/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /payments/i })).toBeInTheDocument();
  });

  it("switches between invoice, subscription and payment empty states without inventing records", () => {
    renderDashboard();

    expect(screen.getByText("Invoices will appear here when an application billing feed is connected.")).toBeInTheDocument();

    // Radix Tabs activates its triggers on the primary-button mousedown event.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /subscriptions/i }), { button: 0 });
    expect(screen.getByText("Subscription records will appear here when an application billing feed is connected.")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: /payments/i }), { button: 0 });
    expect(screen.getByText("Verified payment records will appear here when an application billing feed is connected.")).toBeInTheDocument();
  });

  it("filters the application connection list", () => {
    renderDashboard();

    fireEvent.change(screen.getByRole("combobox", { name: "Filter by application" }), {
      target: { value: "Info Services" },
    });

    const connectionsSection = screen.getByRole("heading", { name: "Application connections" }).closest("section");
    expect(connectionsSection).not.toBeNull();
    expect(within(connectionsSection as HTMLElement).getByText("Info Services")).toBeInTheDocument();
    expect(within(connectionsSection as HTMLElement).queryByText("Inventra")).not.toBeInTheDocument();
  });
});
