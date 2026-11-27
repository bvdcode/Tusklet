import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Brand from "../../shared/Brand";
import logo from "../../shared/assets/tusklet.svg";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <Container
      component="main"
      maxWidth="md"
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        py: { xs: 4, sm: 7 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: { xs: 2, md: 2.5 },
          display: "flex",
          minHeight: { md: 476 },
        }}
      >
        <Stack
          aria-hidden="true"
          sx={{
            display: { xs: "none", md: "flex" },
            flexBasis: "43%",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "brand.main",
            color: "brand.contrastText",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "82%",
              aspectRatio: 1,
              borderRadius: "50%",
              position: "absolute",
              border: 1,
              borderColor: "brand.ring",
              boxShadow: (theme) =>
                `0 0 0 34px ${theme.vars?.palette.brand.ring}, 0 0 0 68px ${theme.vars?.palette.brand.ring}`,
            }}
          />
          <Stack sx={{ alignItems: "center", position: "relative", gap: 1 }}>
            <Box
              component="img"
              src={logo}
              alt=""
              sx={{
                width: 160,
                height: 160,
                filter: "brightness(0) invert(1)",
              }}
            />
            <Typography
              sx={{
                fontSize: 43,
                fontWeight: 800,
                letterSpacing: "-0.06em",
                lineHeight: 1,
              }}
            >
              {t("appName")}
            </Typography>
          </Stack>
        </Stack>
        <Stack
          sx={{
            width: "100%",
            minWidth: 0,
            justifyContent: "center",
            px: { xs: 3, sm: 5, md: 5.5 },
            py: { xs: 4, sm: 6 },
          }}
        >
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 3 }}>
            <Brand />
          </Box>
          {children}
        </Stack>
      </Paper>
    </Container>
  );
}
