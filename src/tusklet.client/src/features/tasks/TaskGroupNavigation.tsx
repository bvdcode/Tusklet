import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useId, useState, type RefObject } from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import type { TaskGroupHeading } from "./taskView";
import useActiveTaskGroup from "./useActiveTaskGroup";

type Props = {
  groups: TaskGroupHeading[];
  headerRef: RefObject<HTMLElement | null>;
  groupsRef: RefObject<HTMLDivElement | null>;
  listRef: RefObject<VirtuosoHandle | null>;
};

const rollIn = keyframes`
  from { transform: perspective(180px) rotateX(var(--tusklet-group-angle)) translateZ(0.65em); }
  to { transform: perspective(180px) rotateX(0deg) translateZ(0); }
`;

const rollOut = keyframes`
  from { transform: perspective(180px) rotateX(0deg) translateZ(0); }
  to {
    transform: perspective(180px) rotateX(calc(-1 * var(--tusklet-group-angle))) translateZ(0.65em);
    visibility: hidden;
  }
`;

const labelStyle = {
  display: "block",
  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
  backfaceVisibility: "hidden",
} as const;
const rollTiming = "160ms ease-out both";

export default function TaskGroupNavigation({
  groups,
  headerRef,
  groupsRef,
  listRef,
}: Props) {
  const { activeGroup: trackedGroup, scrollToGroup } = useActiveTaskGroup(
    headerRef,
    groupsRef,
    listRef,
    groups,
  );
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const buttonId = useId();
  const menuId = useId();
  const activeIndex = Math.max(
    0,
    groups.findIndex(({ id }) => id === trackedGroup?.id),
  );
  const activeGroup = groups[activeIndex];
  const previousIndex = groups.findIndex(
    ({ id }) => id === trackedGroup?.previousId,
  );
  const previousGroup = groups[previousIndex];
  const flip = !reducedMotion && previousGroup && previousIndex !== activeIndex;
  const open = anchor !== null;

  if (!activeGroup) {
    return null;
  }

  const title = (
    <Box
      key={activeGroup.id}
      component="span"
      sx={{
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
        "--tusklet-group-angle":
          previousIndex < activeIndex ? "90deg" : "-90deg",
      }}
    >
      {flip && (
        <Typography
          component="span"
          variant="subtitle2"
          noWrap
          aria-hidden="true"
          sx={{
            ...labelStyle,
            position: "absolute",
            inset: 0,
            animation: `${rollOut} ${rollTiming}`,
          }}
        >
          {previousGroup.title}
        </Typography>
      )}
      <Typography
        component="span"
        variant="subtitle2"
        noWrap
        title={activeGroup.title}
        sx={{
          ...labelStyle,
          animation: flip ? `${rollIn} ${rollTiming}` : undefined,
        }}
      >
        {activeGroup.title}
      </Typography>
    </Box>
  );

  if (groups.length === 1) {
    return title;
  }

  return (
    <>
      <Button
        id={buttonId}
        color="inherit"
        size="small"
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        endIcon={<KeyboardArrowDownRounded />}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          minWidth: 0,
          maxWidth: "100%",
          px: { xs: 0.5, sm: 1 },
          "& .MuiButton-endIcon": { ml: 0.25, mr: 0 },
        }}
      >
        {title}
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          list: { id: menuId, "aria-labelledby": buttonId },
          paper: { sx: { overflowWrap: "anywhere" } },
        }}
      >
        {groups.map(({ id, title }) => (
          <MenuItem
            key={id}
            selected={id === activeGroup.id}
            aria-current={id === activeGroup.id ? "true" : undefined}
            onClick={() => {
              setAnchor(null);
              if (id !== activeGroup.id) {
                scrollToGroup(id, reducedMotion);
              }
            }}
            sx={{ whiteSpace: "normal" }}
          >
            {title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
