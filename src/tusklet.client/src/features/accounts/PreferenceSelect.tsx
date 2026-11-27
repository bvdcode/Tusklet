import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useId } from "react";

type Props = {
  label: string;
  value: string;
  options: { value: string; label: string; language?: string }[];
  onChange: (value: string) => void;
};

export default function PreferenceSelect({
  label,
  value,
  options,
  onChange,
}: Props) {
  const labelId = useId();
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <Typography component="h2" variant="h6" id={labelId}>
        {label}
      </Typography>
      <FormControl size="small" sx={{ width: { xs: "100%", sm: 184 } }}>
        <Select
          labelId={labelId}
          value={value}
          onChange={({ target }) => onChange(target.value)}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box component="span" lang={option.language} dir="auto">
                {option.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
