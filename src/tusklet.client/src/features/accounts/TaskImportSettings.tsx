import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { tasksPath } from "../tasks/taskRoutes";
import { importTasks, taskItemsKey, taskListsKey } from "../tasks/tasksApi";

export default function TaskImportSettings({
  requestToken,
}: {
  requestToken: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const preview = useMutation({
    mutationFn: (backup: File) => importTasks(backup, requestToken, true),
  });
  const apply = useMutation({
    mutationFn: (backup: File) => importTasks(backup, requestToken, false),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskListsKey }),
        queryClient.invalidateQueries({ queryKey: taskItemsKey }),
      ]);
    },
  });
  const report = apply.data ?? preview.data;
  const hasNewRecords =
    report !== undefined &&
    (report.newLists > 0 || report.newTasks > 0 || report.restoredTasks > 0);

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Typography component="h2" variant="h6">
          {t("import.title")}
        </Typography>
        <Box
          component="input"
          ref={input}
          type="file"
          accept=".zip,application/zip"
          aria-label={t("import.choose")}
          hidden
          onChange={(event) => {
            const backup = event.target.files?.[0];
            if (backup !== undefined) {
              event.target.value = "";
              setFile(backup);
              apply.reset();
              preview.mutate(backup);
            }
          }}
        />
        <Button
          variant="outlined"
          startIcon={<UploadFileOutlined />}
          onClick={() => input.current?.click()}
          loading={preview.isPending}
          disabled={apply.isPending}
        >
          {t("import.choose")}
        </Button>
      </Stack>

      {file && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ overflowWrap: "anywhere" }}
        >
          {file.name}
        </Typography>
      )}
      {preview.isError && (
        <Alert severity="error">{t("import.previewError")}</Alert>
      )}
      {apply.isError && (
        <Alert severity="error">{t("import.applyError")}</Alert>
      )}
      {report && (
        <Stack spacing={1.25}>
          <Alert severity={apply.isSuccess ? "success" : "info"}>
            <Typography variant="body2">
              {t("import.contents", { ...report })}
            </Typography>
            <Typography variant="body2">
              {t(apply.isSuccess ? "import.added" : "import.toAdd", {
                ...report,
                skipped: report.tasks - report.newTasks - report.restoredTasks,
              })}
            </Typography>
            {report.restoredTasks > 0 && (
              <Typography variant="body2">
                {t(apply.isSuccess ? "import.restored" : "import.toRestore", {
                  count: report.restoredTasks,
                })}
              </Typography>
            )}
          </Alert>
          {(report.unsupportedTasks > 0 || report.sharedLists > 0) && (
            <Alert severity="warning">
              {report.unsupportedTasks > 0 && (
                <Typography variant="body2">
                  {t("import.partial", report)}
                </Typography>
              )}
              {report.sharedLists > 0 && (
                <Typography variant="body2">
                  {t("import.shared", report)}
                </Typography>
              )}
            </Alert>
          )}
          {apply.isSuccess && (
            <Button
              component={Link}
              to={tasksPath}
              sx={{ alignSelf: { sm: "flex-end" } }}
            >
              {t("import.viewTasks")}
            </Button>
          )}
          {!apply.isSuccess && hasNewRecords && file && (
            <Button
              variant="contained"
              onClick={() => apply.mutate(file)}
              loading={apply.isPending}
              sx={{ alignSelf: { sm: "flex-end" } }}
            >
              {t(
                report.newLists > 0 || report.newTasks > 0
                  ? "import.apply"
                  : "import.restoreAction",
              )}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
