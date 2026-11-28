import { useRef, type RefObject } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { VirtuosoHandle } from "react-virtuoso";
import type { TaskListEntry, TaskRow } from "./taskView";

function isEditing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest(
        'input:not([type="checkbox"]), textarea, select, [role="textbox"], [role="combobox"]',
      ) !== null)
  );
}

function firstVisibleIndex(scroller: HTMLElement) {
  const top = scroller.getBoundingClientRect().top;
  const row = Array.from(
    scroller.querySelectorAll<HTMLElement>("li[data-index]"),
  ).find((item) => item.getBoundingClientRect().bottom > top);
  return Number(row?.dataset.index ?? 0);
}

export default function useTaskWorkspaceShortcuts({
  entries,
  rows,
  getSelectedTaskId,
  scroller,
  listRef,
  dialogOpen,
  onOpenSearch,
  onCreate,
  onSelect,
  onDelete,
}: {
  entries: TaskListEntry[];
  rows: TaskRow[];
  getSelectedTaskId: () => string | undefined;
  scroller: HTMLElement | null;
  listRef: RefObject<VirtuosoHandle | null>;
  dialogOpen: boolean;
  onOpenSearch: () => void;
  onCreate: (() => void) | undefined;
  onSelect: (id: string) => void;
  onDelete: (task: TaskRow) => void;
}) {
  const pendingFocus = useRef<string | null>(null);
  const ignore = (event: KeyboardEvent, allowTaskDetails = false) => {
    const overlay =
      event.target instanceof Element
        ? event.target.closest(
            '[role="dialog"], [role="menu"], [role="listbox"]',
          )
        : null;
    return (
      dialogOpen ||
      event.defaultPrevented ||
      event.isComposing ||
      (overlay !== null &&
        !(allowTaskDetails && overlay.id === "task-details-panel"))
    );
  };
  const options = { enableOnFormTags: true, preventDefault: true };

  function move(event: KeyboardEvent, direction: 1 | -1) {
    if (!scroller) {
      return;
    }
    const taskId = getSelectedTaskId();
    const selectedIndex = entries.findIndex(
      (entry) => entry.kind === "task" && entry.task.id === taskId,
    );
    const focused =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("li[data-index]")
        : null;
    let index = selectedIndex;
    if (index < 0) {
      index = focused
        ? Number(focused.dataset.index)
        : firstVisibleIndex(scroller) - direction;
    }

    for (
      index += direction;
      index >= 0 && index < entries.length;
      index += direction
    ) {
      const entry = entries[index];
      if (entry.kind !== "task") {
        continue;
      }
      const id = entry.task.id;
      pendingFocus.current = id;
      onSelect(id);
      listRef.current?.scrollIntoView({
        index,
        done: () => {
          window.requestAnimationFrame(() => {
            if (pendingFocus.current === id) {
              const target = scroller.querySelector<HTMLElement>(
                `li[data-index="${index}"] [data-task-id]`,
              );
              if (
                target?.dataset.taskId === id &&
                !target.closest('[aria-hidden="true"]')
              ) {
                target.focus({ preventScroll: true });
              }
            }
          });
        },
      });
      return;
    }
  }

  useHotkeys("ctrl+f", onOpenSearch, {
    ...options,
    ignoreEventWhen: (event) => ignore(event),
  });
  useHotkeys("ctrl+n", () => onCreate?.(), {
    ...options,
    ignoreEventWhen: (event) => !onCreate || event.repeat || ignore(event),
  });
  const navigationOptions = {
    ...options,
    ignoreEventWhen: (event: KeyboardEvent) =>
      entries.length === 0 || ignore(event, true) || isEditing(event.target),
  };
  useHotkeys("up", (event) => move(event, -1), navigationOptions);
  useHotkeys("down", (event) => move(event, 1), navigationOptions);
  useHotkeys(
    "delete",
    () => {
      const taskId = getSelectedTaskId();
      const task = rows.find(({ id }) => id === taskId);
      if (task) {
        onDelete(task);
      }
    },
    {
      ...options,
      ignoreEventWhen: (event) =>
        !getSelectedTaskId() ||
        event.repeat ||
        ignore(event, true) ||
        isEditing(event.target),
    },
  );
}
