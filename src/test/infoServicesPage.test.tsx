import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InfoServicesPage from "@/pages/landing/InfoServicesPage";

describe("Info Services page", () => {
  it("renders all service areas and keeps enquiry actions inside Amineva", () => {
    render(<MemoryRouter><InfoServicesPage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /information for better decisions/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our Info Services" })).toBeInTheDocument();

    for (const title of [
      "Career & Education",
      "Business Information",
      "Contracts & Commitments",
      "Travel & Relocation",
      "Info and Report Verification",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    const enquiryLinks = screen.getAllByRole("link", { name: /make an enquiry|submit an enquiry/i });
    const sessionLinks = screen.getAllByRole("link", { name: /book (an information session|a session)/i });
    expect(enquiryLinks).toHaveLength(2);
    expect(sessionLinks).toHaveLength(2);
    enquiryLinks.forEach((link) => expect(link).toHaveAttribute("href", "/support?subject=info-services&request=enquiry"));
    sessionLinks.forEach((link) => expect(link).toHaveAttribute("href", "/support?subject=info-services&request=session"));
  });
});
