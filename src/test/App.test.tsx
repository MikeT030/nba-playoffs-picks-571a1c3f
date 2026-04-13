import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [] })),
      })),
    })),
  },
}));

// We test routing by rendering the App with MemoryRouter overrides
// Since App uses BrowserRouter internally, we test individual pages instead

describe("App routing smoke tests", () => {
  it("NotFound page renders for unknown routes", async () => {
    // Dynamically import after mock
    const NotFound = (await import("@/pages/NotFound")).default;
    render(
      <MemoryRouter initialEntries={["/unknown-route"]}>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
