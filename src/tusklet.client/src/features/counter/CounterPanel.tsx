import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { requestCounter } from "./counterApi";

const counterQueryKey = ["counter"];

export default function CounterPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const counter = useQuery({
    queryKey: counterQueryKey,
    queryFn: ({ signal }) => requestCounter("GET", signal),
    retry: false,
  });
  const increment = useMutation({
    mutationFn: () => requestCounter("POST"),
    onMutate: () => queryClient.cancelQueries({ queryKey: counterQueryKey }),
    onSuccess: (count) => queryClient.setQueryData(counterQueryKey, count),
    onError: () => queryClient.invalidateQueries({ queryKey: counterQueryKey }),
  });
  const loadFailed = counter.data === undefined && counter.isError;

  function handleClick() {
    if (loadFailed) {
      void counter.refetch();
    } else {
      increment.mutate();
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography component="h1" variant="h5">
            {t("counter.title")}
          </Typography>
          <Typography
            component="output"
            variant="h2"
            aria-label={t("counter.value")}
            sx={{ fontVariantNumeric: "tabular-nums", minHeight: "1.2em" }}
          >
            {counter.data}
          </Typography>
          {loadFailed && (
            <Alert severity="error">{t("counter.loadError")}</Alert>
          )}
          {increment.isError && (
            <Alert severity="error">{t("counter.incrementError")}</Alert>
          )}
          <Button
            variant="contained"
            size="large"
            loading={
              counter.isPending ||
              (loadFailed && counter.isFetching) ||
              increment.isPending
            }
            onClick={handleClick}
          >
            {loadFailed ? t("counter.retry") : t("counter.increment")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
