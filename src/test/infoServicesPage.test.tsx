import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InfoServicesPage from "@/pages/landing/DataLensPage";

describe("Info Services page", () => {
  it("renders the page heading, all five service areas and enquiry actions", () => {
    render(<InfoServicesPage />);

    expect(screen.getByRole("heading", { name: /information for better decisions/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our Info Services" })).toBeInTheDocument();

    for (const title of [
      "Career & Education",
      "Business Information",
      "Contracts & Communication",
      "Travel & Relocation",
      "Info and Reports Verification",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    expect(screen.getAllByRole("link", { name: /make an enquiry|submit an enquiry/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /book (an information session|a session)/i })).toHaveLength(2);
  });
});
