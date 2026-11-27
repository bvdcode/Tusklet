import AddRounded from "@mui/icons-material/AddRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import {
  FormControl,
  IconButton,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";
import { useId, useState } from "react";
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
  onListChange: (id: string) => void;
  onGroupingChange: (value: TaskGrouping) => void;
  onSortingChange: (value: TaskSorting) => void;
  onCreate: () => void;
};

export default function WorkspaceControls({
  lists,
  activeId,
  grouping,
  sorting,
  canCreate,
  onListChange,
  onGroupingChange,
  onSortingChange,
  onCreate,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const edge = useTheme().direction === "rtl" ? "left" : "right";
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack
      direction="row"
      sx={{
        flex: 1,
        minWidth: 0,
        justifyContent: "flex-end",
        alignItems: "center",
        gap: { xs: 0.25, sm: 0.75 },
      }}
    >
      <FormControl
        size="small"
        sx={{ width: { xs: "100%", sm: 208 }, minWidth: 0 }}
      >
        <Select
          displayEmpty
          value={activeId}
          onChange={(event) => onListChange(event.target.value)}
          SelectDisplayProps={{ "aria-label": t("tasks.list") }}
          sx={{
            typography: { xs: "body2", sm: "body1" },
            "& .MuiSelect-select": { pl: { xs: 1, sm: 1.75 } },
          }}
        >
          <MenuItem value="">{t("tasks.allTasks")}</MenuItem>
          {lists.map((list) => (
            <MenuItem key={list.id} value={list.id}>
              {list.isInbox ? t("tasks.inbox") : list.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton
        aria-label={t("tasks.filters")}
        title={t("tasks.filters")}
        aria-expanded={anchor !== null}
        aria-haspopup="dialog"
        aria-controls={anchor ? id : undefined}
        color={
          grouping !== "none" || sorting !== "listOrder" ? "primary" : "default"
        }
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <TuneRounded />
      </IconButton>
      <IconButton
        aria-label={t("tasks.create")}
        title={t("tasks.create")}
        color="primary"
        disabled={!canCreate}
        onClick={onCreate}
      >
        <AddRounded />
      </IconButton>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: edge }}
        transformOrigin={{ vertical: "top", horizontal: edge }}
        slotProps={{
          paper: {
            id,
            role: "dialog",
            "aria-label": t("tasks.filters"),
            sx: { mt: 0.75 },
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 272, maxWidth: "100%" }}>
          <TextField
            select
            size="small"
            label={t("tasks.groupBy")}
            value={grouping}
            slotProps={{
              select: { native: true },
              inputLabel: { shrink: true },
            }}
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
            slotProps={{
              select: { native: true },
              inputLabel: { shrink: true },
            }}
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
