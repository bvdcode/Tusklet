import { Paper, Stack, Typography, useTheme } from "@mui/material";
import {
  SnackbarContent,
  SnackbarProvider,
  type CustomContentProps,
} from "notistack";
import { forwardRef, type ReactNode } from "react";

const NotificationContent = forwardRef<HTMLDivElement, CustomContentProps>(
  function NotificationContent({ id, message, action, className, style }, ref) {
    return (
      <SnackbarContent
        ref={ref}
        className={className}
        style={style}
        role="status"
      >
        <Paper
          variant="outlined"
          sx={{ width: "100%", maxWidth: { sm: 480 }, boxShadow: 3 }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ flex: "1 1 180px", overflowWrap: "anywhere" }}
            >
              {message}
            </Typography>
            {typeof action === "function" ? action(id) : action}
          </Stack>
        </Paper>
      </SnackbarContent>
    );
  },
);

const components = { default: NotificationContent };

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const edge = useTheme().direction === "rtl" ? "left" : "right";

  return (
    <SnackbarProvider
      maxSnack={4}
      autoHideDuration={4500}
      anchorOrigin={{ vertical: "bottom", horizontal: edge }}
      preventDuplicate
      Components={components}
    >
      {children}
    </SnackbarProvider>
  );
}
