import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, expect, test, vi } from "vitest";
import i18n from "../../shared/i18n";
import LocaleThemeProvider from "../../shared/LocaleThemeProvider";
import TaskSearchField from "./TaskSearchField";

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

test("opens and focuses search in a right-to-left language", async () => {
  await i18n.changeLanguage("ar");
  render(
    <LocaleThemeProvider>
      <TaskSearchField
        id="task-search"
        inputRef={createRef<HTMLInputElement>()}
        active
        value=""
        onChange={vi.fn()}
        onClose={vi.fn()}
      />
    </LocaleThemeProvider>,
  );

  const search = screen.getByRole("searchbox", {
    name: i18n.t("tasks.search"),
  });
  expect(document.documentElement.dir).toBe("rtl");
  expect(document.activeElement).toBe(search);
});
