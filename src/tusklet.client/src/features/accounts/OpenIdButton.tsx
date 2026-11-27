import KeyOutlined from "@mui/icons-material/KeyOutlined";
import { Box, Button } from "@mui/material";
import { useEffect, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

const buttonSizes = { login: "large", link: "medium" } as const;

type Props = {
  action: "login" | "link";
  requestToken: string;
  redirecting: boolean;
  setRedirecting: (value: boolean) => void;
  disabled: boolean;
};

export default function OpenIdButton({
  action,
  requestToken,
  redirecting,
  setRedirecting,
  disabled,
}: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    function resetPending() {
      setRedirecting(false);
    }
    window.addEventListener("pageshow", resetPending);
    return () => window.removeEventListener("pageshow", resetPending);
  }, [setRedirecting]);

  function submit(event: FormEvent<HTMLFormElement>) {
    if (redirecting || disabled) {
      event.preventDefault();
      return;
    }
    setRedirecting(true);
  }

  return (
    <Box
      component="form"
      action={`/api/auth/openid/${action}`}
      method="post"
      onSubmit={submit}
      aria-busy={redirecting}
    >
      <input
        type="hidden"
        name="__RequestVerificationToken"
        value={requestToken}
      />
      <Button
        type="submit"
        variant="outlined"
        size={buttonSizes[action]}
        fullWidth
        startIcon={<KeyOutlined />}
        loading={redirecting}
        loadingPosition="start"
        disabled={disabled}
      >
        {t({ login: "auth.openIdLogin", link: "auth.linkOpenId" }[action])}
      </Button>
    </Box>
  );
}
