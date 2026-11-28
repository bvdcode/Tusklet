import EditOutlined from "@mui/icons-material/EditOutlined";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import type { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";

export default function TaskDetailsNote({
  note,
  editor,
  editDisabled,
  editButtonRef,
  onEdit,
}: {
  note: string | null;
  editor?: ReactNode;
  editDisabled: boolean;
  editButtonRef: Ref<HTMLButtonElement>;
  onEdit: () => void;
}) {
  const { t } = useTranslation();

  if (editor) {
    return <Box sx={{ px: 2, mt: 2 }}>{editor}</Box>;
  }

  return (
    <ButtonBase
      ref={editButtonRef}
      disabled={editDisabled}
      onClick={onEdit}
      title={t("tasks.editNote")}
      sx={{
        display: "block",
        width: "100%",
        mt: 2,
        px: 2,
        borderRadius: 1,
        textAlign: "start",
      }}
    >
      <Stack
        component="span"
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography component="span" variant="subtitle2">
          {t("tasks.note")}
        </Typography>
        <EditOutlined fontSize="small" color="action" />
      </Stack>
      {note && (
        <Typography
          component="span"
          variant="body2"
          sx={{
            display: "block",
            mt: 0.5,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {note}
        </Typography>
      )}
    </ButtonBase>
  );
}
