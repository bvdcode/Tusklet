import { createTheme, type ThemeOptions } from "@mui/material/styles";

type BrandPalette = {
  main: string;
  contrastText: string;
  ring: string;
  fieldBorder: string;
};

declare module "@mui/material/styles" {
  interface Palette {
    brand: BrandPalette;
  }

  interface PaletteOptions {
    brand?: BrandPalette;
  }
}

const options: ThemeOptions = {
  cssVariables: { colorSchemeSelector: "data-color-scheme" },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"DM Sans Variable", system-ui, sans-serif',
    h3: { fontSize: "2.45rem", fontWeight: 750, letterSpacing: "-0.055em" },
    h4: { fontSize: "1.9rem", fontWeight: 750, letterSpacing: "-0.045em" },
    h6: { fontWeight: 700, letterSpacing: "-0.025em" },
    subtitle1: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 650 },
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#264CCF", contrastText: "#FFFFFF" },
        background: { default: "#F5F7FB", paper: "#FFFFFF" },
        text: { primary: "#17213A", secondary: "#59657B" },
        action: { selected: "#E9EEFF" },
        success: { main: "#216E4E" },
        warning: { main: "#8A5500" },
        error: { main: "#B83248" },
        brand: {
          main: "#264CCF",
          contrastText: "#FFFFFF",
          ring: "#FFFFFF24",
          fieldBorder: "#8290A6",
        },
      },
    },
    dark: {
      palette: {
        primary: { main: "#94ABFF", contrastText: "#101521" },
        background: { default: "#101521", paper: "#191F2F" },
        text: { primary: "#F1F4FF", secondary: "#A8B3C9" },
        action: { selected: "#27345E" },
        success: { main: "#73D9AA" },
        warning: { main: "#FFC56C" },
        error: { main: "#FF9BAA" },
        brand: {
          main: "#25397D",
          contrastText: "#FFFFFF",
          ring: "#FFFFFF24",
          fieldBorder: "#64718A",
        },
      },
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        "html, body": { height: "100%" },
        "#root": {
          "--tusklet-account-toolbar-height": "60px",
          [theme.breakpoints.up("sm")]: {
            "--tusklet-account-toolbar-height": "68px",
          },
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
        },
      }),
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: (theme.vars || theme).palette.primary.main,
          backgroundColor: (theme.vars || theme).palette.action.selected,
          fontWeight: 700,
          fontSize: "0.9rem",
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: ({ theme }) => {
          const { background, text } = (theme.vars ?? theme).palette;
          return {
            "&&:is(:autofill, :-webkit-autofill)": {
              boxShadow: `inset 0 0 0 1000px ${background.paper}`,
              WebkitTextFillColor: text.primary,
              caretColor: text.primary,
            },
          };
        },
        notchedOutline: ({ theme }) => ({
          borderColor: (theme.vars || theme).palette.brand.fieldBorder,
        }),
      },
    },
  },
};

const theme = createTheme(options);
export const rtlTheme = createTheme({ ...options, direction: "rtl" });

export default theme;
