import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Box, ButtonBase, IconButton, Stack, Typography } from "@mui/material";
import type { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { taskWorkspaceHeading } from "./taskWorkspaceStyles";

export default function TaskDetailsHeader({
  title,
  titleId,
  compact,
  editDisabled,
  editButtonRef,
  editor,
  onClose,
  onEdit,
}: {
  title: string;
  titleId: string;
  compact: boolean;
  editDisabled: boolean;
  editButtonRef: Ref<HTMLButtonElement>;
  editor?: ReactNode;
  onClose: () => void;
  onEdit: () => void;
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
        <Typography
          id={titleId}
          component="h2"
          sx={editor ? taskWorkspaceHeading : undefined}
        >
          {editor ? (
            title
          ) : (
            <ButtonBase
              ref={editButtonRef}
              disabled={editDisabled}
              onClick={onEdit}
              title={t("tasks.editTitle")}
              sx={{
                gap: 1,
                borderRadius: 1,
                textAlign: "start",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography
                component="span"
                variant="h6"
                sx={{ minWidth: 0, overflowWrap: "anywhere" }}
              >
                {title}
              </Typography>
              <EditOutlined
                fontSize="small"
                color="action"
                sx={{ flexShrink: 0 }}
              />
            </ButtonBase>
          )}
        </Typography>
        {editor}
      </Box>
      {!compact && (
        <IconButton
          onClick={onClose}
          aria-label={t("common.close")}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <CloseRounded />
        </IconButton>
      )}
    </Stack>
  );
}
