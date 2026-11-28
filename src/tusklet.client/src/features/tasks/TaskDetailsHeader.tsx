import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskTextEditor from "./TaskTextEditor";
import { taskWorkspaceHeading } from "./taskWorkspaceStyles";

export default function TaskDetailsHeader({
  title,
  titleId,
  compact,
  onClose,
  onSave,
}: {
  title: string;
  titleId: string;
  compact: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "flex-start", px: 3, py: 2, gap: 1, flexShrink: 0 }}
    >
      {compact && (
        <IconButton
          onClick={onClose}
          aria-label={t("common.back")}
          sx={{ flexShrink: 0 }}
        >
          <ArrowBackRounded
            sx={{
              transform: (theme) =>
                theme.direction === "rtl" ? "scaleX(-1)" : undefined,
            }}
          />
        </IconButton>
      )}
      <Box sx={{ minWidth: 0, flex: 1, alignSelf: "center" }}>
        <Typography id={titleId} component="h2" sx={taskWorkspaceHeading}>
          {title}
        </Typography>
        <TaskTextEditor field="title" value={title} onSave={onSave} />
      </Box>
    </Stack>
  );
}
