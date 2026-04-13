import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FloatingNav from "@/components/FloatingNav";

const renderNav = (route = "/") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <FloatingNav />
    </MemoryRouter>
  );

describe("FloatingNav", () => {
  it("renders all navigation links", () => {
    renderNav();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Scoreboard")).toBeInTheDocument();
    expect(screen.getByText("My Picks")).toBeInTheDocument();
  });

  it("links to correct paths", () => {
    renderNav();
    expect(screen.getByText("Home").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Scoreboard").closest("a")).toHaveAttribute("href", "/scoreboard");
    expect(screen.getByText("My Picks").closest("a")).toHaveAttribute("href", "/my-picks");
  });

  it("applies active styling to the current route", () => {
    renderNav("/scoreboard");
    const scoreboardLink = screen.getByText("Scoreboard").closest("a");
    expect(scoreboardLink?.className).toContain("bg-primary/15");
  });

  it("applies inactive styling to non-current routes", () => {
    renderNav("/scoreboard");
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.className).toContain("text-[#F9F9FA]");
    expect(homeLink?.className).not.toContain("bg-primary/15");
  });
});
