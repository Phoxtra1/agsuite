import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupportPage from "@/pages/landing/SupportPage";

describe("Info Services support requests", () => {
  it.each([
    ["enquiry", "I would like to make an enquiry about Info Services."],
    ["session", "I would like to request an Info Services information session."],
  ])("preselects Info Services and prepares the %s request", (request, message) => {
    render(
      <MemoryRouter initialEntries={[`/support?subject=info-services&request=${request}`]}>
        <Routes>
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("combobox")).toHaveValue("datalens");
    expect(screen.getByPlaceholderText("Describe your inquiry...")).toHaveValue(message);
  });
});
