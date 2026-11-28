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
      sx={{
        alignItems: "flex-start",
        pl: { xs: 1, sm: 3 },
        pr: 3,
        py: { xs: 1, sm: 2 },
        gap: { xs: 0.5, sm: 1 },
        flexShrink: 0,
      }}
    >
      {compact && (
        <IconButton
          onClick={onClose}
          aria-label={t("common.back")}
          sx={(theme) => ({
            flexShrink: 0,
            [theme.breakpoints.down("sm")]: {
              width: theme.spacing(5),
              height: theme.spacing(5),
              "& svg": { fontSize: theme.typography.pxToRem(20) },
            },
          })}
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
