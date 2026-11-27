import { List, Typography } from "@mui/material";
import { memo, useId, useMemo, type Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  Virtuoso,
  type Components,
  type ItemProps,
  type ListProps,
  type VirtuosoHandle,
} from "react-virtuoso";
import TaskListRow from "./TaskListRow";
import { getLocalToday } from "./taskDueDate";
import type { TaskListEntry } from "./taskView";

type ListContext = { label: string };

function TaskList({
  context,
  ...props
}: ListProps<HTMLUListElement> & { context: ListContext }) {
  return <List {...props} disablePadding aria-label={context.label} />;
}

function TaskEntry({
  item,
  children,
  style,
  "data-index": index,
  "data-item-index": itemIndex,
  "data-known-size": size,
}: ItemProps<TaskListEntry>) {
  return (
    <li
      style={style}
      data-index={index}
      data-item-index={itemIndex}
      data-known-size={size}
      data-task-group={item.groupId}
      role={item.kind === "heading" ? "presentation" : undefined}
    >
      {children}
    </li>
  );
}

const components: Components<TaskListEntry, ListContext, HTMLUListElement> = {
  List: TaskList,
  Item: TaskEntry,
};

function entryKey(_: number, entry: TaskListEntry) {
  switch (entry.kind) {
    case "heading":
      return `heading:${entry.groupId}`;
    case "task":
      return entry.task.id;
  }
}

export default memo(function TaskVirtualList({
  entries,
  listRef,
  showListName,
  changing,
  selectedTaskId,
  onTaskSelect,
  onCompletionChange,
}: {
  entries: TaskListEntry[];
  listRef: Ref<VirtuosoHandle>;
  showListName: boolean;
  changing: boolean;
  selectedTaskId: string | null;
  onTaskSelect: (id: string) => void;
  onCompletionChange: (id: string, isCompleted: boolean) => void;
}) {
  const titleId = useId();
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        dateStyle: "medium",
        timeZone: "UTC",
      }),
    [language],
  );
  const today = getLocalToday();

  return (
    <Virtuoso
      ref={listRef}
      useWindowScroll
      data={entries}
      components={components}
      context={{ label: t("tasks.title") }}
      computeItemKey={entryKey}
      increaseViewportBy={240}
      defaultItemHeight={65}
      itemContent={(_, entry) => {
        switch (entry.kind) {
          case "heading":
            return (
              <Typography
                component="h2"
                variant="subtitle1"
                align="center"
                sx={{ pt: 2, pb: 1.25 }}
              >
                {entry.title}
              </Typography>
            );
          case "task":
            return (
              <TaskListRow
                task={entry.task}
                first={entry.first}
                last={entry.last}
                selected={selectedTaskId === entry.task.id}
                changing={changing}
                showListName={showListName}
                titleId={titleId}
                date={date}
                today={today}
                t={t}
                onTaskSelect={onTaskSelect}
                onCompletionChange={onCompletionChange}
              />
            );
        }
      }}
    />
  );
});
