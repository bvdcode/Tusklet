import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import logo from "./assets/tusklet.svg";

export default function Brand() {
  const { t } = useTranslation();

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box
        component="img"
        src={logo}
        alt=""
        sx={(theme) => ({
          width: 38,
          height: 38,
          ...theme.applyStyles("dark", { filter: "brightness(0) invert(1)" }),
        })}
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
