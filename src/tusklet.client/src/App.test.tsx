import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";
import "./shared/i18n";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderApp() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

test("renders the server count and increments it", async () => {
  const fetchCounter = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ count: 4 }))
    .mockResolvedValueOnce(Response.json({ count: 5 }));
  vi.stubGlobal("fetch", fetchCounter);

  renderApp();

  expect(screen.getByRole("heading", { name: "Counter" })).toBeTruthy();
  const count = screen.getByRole("status", { name: "Current count" });
  await waitFor(() => expect(count.textContent).toBe("4"));

  fireEvent.click(screen.getByRole("button", { name: "Increment" }));
  await waitFor(() => expect(count.textContent).toBe("5"));

  expect(fetchCounter).toHaveBeenNthCalledWith(1, "/api/counter", {
    method: "GET",
    signal: expect.any(AbortSignal),
  });
  expect(fetchCounter).toHaveBeenNthCalledWith(2, "/api/counter", {
    method: "POST",
    signal: undefined,
  });
});

test("can retry if the counter could not be loaded", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(Response.json({ count: 0 })),
  );

  renderApp();

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not load the counter.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  const count = screen.getByRole("status", { name: "Current count" });
  await waitFor(() => expect(count.textContent).toBe("0"));
});
