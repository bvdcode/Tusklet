import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import "./shared/i18n";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderApp(path = "/") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
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
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByRole("heading", { name: "Today" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Account menu" })).toBeTruthy();
  expect(fetchSession).toHaveBeenNthCalledWith(2, "/api/auth/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": "test-csrf",
    },
    body: JSON.stringify({
      username: "admin",
      password: "sample-test-password",
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

test("locks both sign-in actions during an OpenID redirect and unlocks on return", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        setupRequired: false,
        openIdEnabled: true,
        user: null,
        requestToken: "test-csrf",
      }),
    ),
  );
  renderApp();

  const openId = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Sign in with OpenID",
  });
  const password = screen.getByRole<HTMLButtonElement>("button", {
    name: "Sign in",
  });
  const form = openId.form;
  if (form === null) {
    throw new Error("OpenID form was not found.");
  }
  expect(form.getAttribute("action")).toBe("/api/auth/openid/login");
  fireEvent.submit(form);
  expect(openId.disabled).toBe(true);
  expect(password.disabled).toBe(true);

  fireEvent(window, new Event("pageshow"));
  expect(openId.disabled).toBe(false);
  expect(password.disabled).toBe(false);
});

test("opens profile and administration from the account menu", async () => {
  const session = {
    setupRequired: false,
    openIdEnabled: true,
    user: {
      id: "admin-id",
      username: "admin",
      isAdmin: true,
      openIdLinked: false,
    },
    requestToken: "test-csrf",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/admin/openid"
          ? new Response(null, { status: 204 })
          : Response.json(session),
      ),
    ),
  );
  renderApp();

  const menu = await screen.findByRole("button", { name: "Account menu" });
  expect(screen.queryByRole("button", { name: "OpenID settings" })).toBeNull();
  fireEvent.click(menu);
  fireEvent.click(
    await screen.findByRole("menuitem", { name: "Profile settings" }),
  );
  expect(await screen.findByRole("heading", { name: "admin" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Profile" })).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();

  fireEvent.click(menu);
  fireEvent.click(
    await screen.findByRole("menuitem", { name: "Administration" }),
  );
  expect(await screen.findByLabelText(/^Issuer URL/)).toBeTruthy();
  expect(screen.getByRole("heading", { name: "OpenID Connect" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Administration" })).toBeNull();
});

test("shows a linked OpenID account with an accessible check icon", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        setupRequired: false,
        openIdEnabled: true,
        user: {
          id: "admin-id",
          username: "admin",
          isAdmin: true,
          openIdLinked: true,
        },
        requestToken: "test-csrf",
      }),
    ),
  );

  renderApp("/profile?openid=linked");

  expect(
    await screen.findByRole("img", { name: "OpenID account linked." }),
  ).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(
    screen.queryByText("OpenID account linked.", { selector: "p" }),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Unlink OpenID account" }),
  ).toBeTruthy();
});
