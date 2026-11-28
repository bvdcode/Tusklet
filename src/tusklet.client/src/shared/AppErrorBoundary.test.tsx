import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import AppErrorBoundary from "./AppErrorBoundary";
import "./i18n";

afterEach(cleanup);

function FailedView(): never {
  throw new Error("Test render failure");
}

test("shows a reload action after a render error", () => {
  render(
    <AppErrorBoundary>
      <FailedView />
    </AppErrorBoundary>,
    { onCaughtError: vi.fn() },
  );

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("Could not display this page.");
  expect(within(alert).getByRole("button", { name: "Reload" })).toBeTruthy();
});
