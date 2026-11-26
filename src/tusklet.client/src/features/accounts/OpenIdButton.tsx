import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  action: "login" | "link";
  requestToken: string;
};

export default function OpenIdButton({ action, requestToken }: Props) {
  const { t } = useTranslation();

  return (
    <Box component="form" action={`/api/auth/openid/${action}`} method="post">
      <input
        type="hidden"
        name="__RequestVerificationToken"
        value={requestToken}
      />
      <Button type="submit" variant="outlined" fullWidth>
        {t({ login: "auth.openIdLogin", link: "auth.linkOpenId" }[action])}
      </Button>
    </Box>
  );
}
