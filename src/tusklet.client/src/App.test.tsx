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

test("creates the initial admin and shows the workspace", async () => {
  const fetchSession = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        setupRequired: true,
        openIdEnabled: false,
        user: null,
        requestToken: "test-csrf",
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(
      Response.json({
        setupRequired: false,
        openIdEnabled: false,
        user: {
          id: "admin-id",
          username: "admin",
          isAdmin: true,
          openIdLinked: false,
        },
        requestToken: "signed-in-csrf",
      }),
    );
  vi.stubGlobal("fetch", fetchSession);

  renderApp();

  expect(
    await screen.findByRole("heading", { name: "Create your admin account" }),
  ).toBeTruthy();
  expect(screen.queryByText("Organize the inbox")).toBeNull();
  fireEvent.change(screen.getByLabelText("Username", { exact: false }), {
    target: { value: "admin" },
  });
  fireEvent.change(screen.getByLabelText("Password", { exact: false }), {
    target: { value: "sample-test-password" },
  });
  const setupCode = "0123456789ABCDEF0123456789ABCDEF";
  fireEvent.change(screen.getByLabelText("Setup code", { exact: false }), {
    target: { value: setupCode },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByRole("heading", { name: "Today" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "OpenID settings" })).toBeTruthy();
  expect(fetchSession).toHaveBeenNthCalledWith(2, "/api/auth/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": "test-csrf",
    },
    body: JSON.stringify({
      username: "admin",
      password: "sample-test-password",
      setupCode,
    }),
  });
});

test("can retry loading the sign-in screen", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(
        Response.json({
          setupRequired: false,
          openIdEnabled: true,
          user: null,
          requestToken: "test-csrf",
        }),
      ),
  );

  renderApp();

  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy(),
  );
  expect(
    screen.getByRole("button", { name: "Sign in with OpenID" }),
  ).toBeTruthy();
});
