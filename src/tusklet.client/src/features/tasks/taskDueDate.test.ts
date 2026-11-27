import { afterEach, expect, test, vi } from "vitest";
import { getShortcutDate } from "./taskDueDate";

afterEach(() => {
  vi.useRealTimers();
});

test("resolves each shortcut from the current local calendar date", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 31, 23, 45));

  expect(getShortcutDate("none")).toBe("");
  expect(getShortcutDate("today")).toBe("2026-01-31");
  expect(getShortcutDate("tomorrow")).toBe("2026-02-01");
  expect(getShortcutDate("week")).toBe("2026-02-07");
  expect(getShortcutDate("month")).toBe("2026-02-28");
  expect(getShortcutDate("twoMonths")).toBe("2026-03-31");
  expect(getShortcutDate("halfYear")).toBe("2026-07-31");
  expect(getShortcutDate("year")).toBe("2027-01-31");

  vi.setSystemTime(new Date(2026, 1, 1, 0, 15));
  expect(getShortcutDate("tomorrow")).toBe("2026-02-02");

  vi.setSystemTime(new Date(2028, 1, 29, 12));
  expect(getShortcutDate("year")).toBe("2029-02-28");
});
