import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../../shared/Brand";
import {
  changeAccount,
  sessionKey,
  type SessionStatus,
  type SessionUser,
} from "./accountsApi";

type Props = {
  session: SessionStatus;
  user: SessionUser;
  onLogout: () => void;
};

export default function AccountHeader({ session, user, onLogout }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;

  const logout = useMutation({
    mutationFn: () =>
      changeAccount("/api/auth/logout", session.requestToken, "POST"),
    onSuccess: async () => {
      setAnchor(null);
      onLogout();
      void navigate("/", { replace: true });
      await queryClient.resetQueries({ queryKey: sessionKey, exact: true });
    },
  });

  function close() {
    if (!logout.isPending) {
      setAnchor(null);
    }
  }

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="md">
        <Toolbar
          disableGutters
          sx={{
            justifyContent: "space-between",
            gap: 2,
            minHeight: { xs: 60, sm: 68 },
          }}
        >
          <Box
            component={Link}
            to="/"
            sx={{ color: "inherit", textDecoration: "none", borderRadius: 1 }}
          >
            <Brand />
          </Box>
          <IconButton
            id="account-menu-button"
            aria-label={t("auth.accountMenu")}
            title={t("auth.accountMenu")}
            aria-haspopup="menu"
            aria-controls={open ? "account-menu" : undefined}
            aria-expanded={open}
            onClick={(event) => setAnchor(event.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <Avatar aria-hidden="true">
              {Array.from(user.username)[0]?.toLocaleUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchor}
            open={open}
            onClose={close}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              list: {
                id: "account-menu",
                "aria-labelledby": "account-menu-button",
              },
              paper: { sx: { minWidth: 216, mt: 0.75 } },
            }}
          >
            <Box sx={{ px: 2, py: 1, maxWidth: 240 }}>
              <Typography variant="subtitle2" noWrap>
                {user.username}
              </Typography>
            </Box>
            <Divider sx={{ mb: 0.5 }} />
            <MenuItem
              component={Link}
              to="/profile"
              onClick={close}
              disabled={logout.isPending}
            >
              <ListItemIcon>
                <PersonOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t("auth.profileSettings")}</ListItemText>
            </MenuItem>
            {user.isAdmin && (
              <MenuItem
                component={Link}
                to="/admin"
                onClick={close}
                disabled={logout.isPending}
              >
                <ListItemIcon>
                  <AdminPanelSettingsOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t("auth.admin")}</ListItemText>
              </MenuItem>
            )}
            <Divider />
            <MenuItem
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              aria-busy={logout.isPending}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                {logout.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <LogoutOutlined fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>{t("auth.logout")}</ListItemText>
            </MenuItem>
            {logout.isError && (
              <Alert severity="error" sx={{ mx: 1, my: 0.5, maxWidth: 240 }}>
                {t("auth.logoutError")}
              </Alert>
            )}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
