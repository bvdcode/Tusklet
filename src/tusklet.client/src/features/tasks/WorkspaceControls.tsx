import AddRounded from "@mui/icons-material/AddRounded";
import FilterAltOutlined from "@mui/icons-material/FilterAltOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  IconButton,
  Popover,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useId, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import type { TaskList } from "./tasksApi";
import {
  groupingOptions,
  sortingOptions,
  type TaskGrouping,
  type TaskSorting,
} from "./taskView";

type Props = {
  lists: TaskList[];
  activeId: string;
  grouping: TaskGrouping;
  sorting: TaskSorting;
  canCreate: boolean;
  searchOpen: boolean;
  searchId: string;
  searchButtonRef: Ref<HTMLButtonElement>;
  onSearchToggle: () => void;
  onListChange: (id: string) => void;
  onGroupingChange: (value: TaskGrouping) => void;
  onSortingChange: (value: TaskSorting) => void;
  onCreate: () => void;
};

const selectSlots = {
  select: { native: true },
  inputLabel: { shrink: true },
} as const;

export default function WorkspaceControls({
  lists,
  activeId,
  grouping,
  sorting,
  canCreate,
  searchOpen,
  searchId,
  searchButtonRef,
  onSearchToggle,
  onListChange,
  onGroupingChange,
  onSortingChange,
  onCreate,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const edge = theme.direction === "rtl" ? "left" : "right";
  const menuAlignment = compact ? "center" : edge;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack
      direction="row"
      sx={{
        flex: 1,
        minWidth: 0,
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <IconButton
        ref={searchButtonRef}
        aria-label={t("tasks.search")}
        title={t("tasks.search")}
        aria-keyshortcuts="Control+F"
        aria-expanded={searchOpen}
        aria-controls={searchOpen ? searchId : undefined}
        color="primary"
        size="small"
        onClick={onSearchToggle}
      >
        <SearchRounded />
      </IconButton>
      <IconButton
        aria-label={t("tasks.filters")}
        title={t("tasks.filters")}
        aria-expanded={anchor !== null}
        aria-haspopup="dialog"
        aria-controls={anchor ? id : undefined}
        color="primary"
        size="small"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <FilterAltOutlined />
      </IconButton>
      <IconButton
        aria-label={t("tasks.create")}
        title={t("tasks.create")}
        aria-keyshortcuts="Control+N"
        color="primary"
        size="small"
        disabled={!canCreate}
        onClick={onCreate}
      >
        <AddRounded />
      </IconButton>
      <Popover
        open={anchor !== null}
        elevation={compact ? 0 : undefined}
        anchorEl={compact ? anchor?.closest("header") : anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: menuAlignment }}
        transformOrigin={{ vertical: "top", horizontal: menuAlignment }}
        slotProps={{
          paper: {
            id,
            role: "dialog",
            "aria-label": t("tasks.filters"),
            sx: {
              mt: 0.75,
              width: { xs: `calc(100% - ${theme.spacing(4)})`, sm: 272 },
              ...(compact && { border: 1, borderColor: "divider" }),
            },
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <TextField
            select
            size="small"
            label={t("tasks.list")}
            value={activeId}
            slotProps={selectSlots}
            onChange={(event) => onListChange(event.target.value)}
          >
            <option value="">{t("tasks.allTasks")}</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.isInbox ? t("tasks.inbox") : list.name}
              </option>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t("tasks.groupBy")}
            value={grouping}
            slotProps={selectSlots}
            onChange={(event) => {
              const value = groupingOptions.find(
                (option) => option === event.target.value,
              );
              if (value !== undefined) {
                onGroupingChange(value);
              }
            }}
          >
            {groupingOptions.map((option) => (
              <option key={option} value={option}>
                {t(`tasks.groupOptions.${option}`)}
              </option>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t("tasks.sortBy")}
            value={sorting}
            slotProps={selectSlots}
            onChange={(event) => {
              const value = sortingOptions.find(
                (option) => option === event.target.value,
              );
              if (value !== undefined) {
                onSortingChange(value);
              }
            }}
          >
            {sortingOptions.map((option) => (
              <option key={option} value={option}>
                {t(`tasks.sortOptions.${option}`)}
              </option>
            ))}
          </TextField>
        </Stack>
      </Popover>
    </Stack>
  );
}
