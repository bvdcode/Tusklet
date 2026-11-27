import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import logo from "./assets/tusklet.svg";

export default function Brand() {
  const { t } = useTranslation();

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          bgcolor: "primary.main",
          mask: `url("${logo}") center / contain no-repeat`,
        }}
      />
      <Typography
        component="span"
        sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.055em" }}
      >
        {t("appName")}
      </Typography>
    </Stack>
  );
}
