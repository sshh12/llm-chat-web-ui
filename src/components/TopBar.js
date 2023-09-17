import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";

const drawerWidth = 240;

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function TopBar({ historyOpen, handleDrawerOpen }) {
  return (
    <AppBarStyled position="fixed" open={historyOpen}>
      <Toolbar>
        <IconButton
          color="inherit"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ mr: 2, ...(historyOpen && { display: "none" }) }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          LLM Chat
        </Typography>
        <Stack direction="row" spacing={0} edge="end">
          <IconButton size="large" color="inherit">
            <SettingsApplicationsIcon />
          </IconButton>
          <IconButton color="inherit" size="large">
            <AddIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBarStyled>
  );
}

export default TopBar;
