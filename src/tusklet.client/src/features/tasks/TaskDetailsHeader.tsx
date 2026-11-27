import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { ButtonBase, IconButton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function TaskDetailsHeader({
  title,
  titleId,
  compact,
  saving,
  onClose,
  onEdit,
}: {
  title: string;
  titleId: string;
  compact: boolean;
  saving: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "flex-start", p: 2, gap: 1, flexShrink: 0 }}
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
      <Typography
        id={titleId}
        component="h2"
        variant="h6"
        sx={{ minWidth: 0, flex: 1, alignSelf: "center" }}
      >
        <ButtonBase
          disabled={saving}
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
            variant="inherit"
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
      </Typography>
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
