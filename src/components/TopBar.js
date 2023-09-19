import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import AddIcon from "@mui/icons-material/Add";
import ShareIcon from "@mui/icons-material/Share";
import Stack from "@mui/material/Stack";
import DeleteIcon from "@mui/icons-material/Delete";
import LinearProgress from "@mui/material/LinearProgress";

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

function TopBar({
  historyOpen,
  handleDrawerOpen,
  curChat,
  onDeleteChat,
  onNewChat,
  loading,
  generating,
}) {
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
          {curChat?.name || "Chat"}
        </Typography>
        <Stack direction="row" spacing={0} edge="end">
          {curChat.id && (
            <IconButton
              size="large"
              color="warning"
              onClick={() => onDeleteChat(curChat.id)}
            >
              <DeleteIcon />
            </IconButton>
          )}
          {curChat.id && (
            <IconButton size="large" color="success">
              <ShareIcon />
            </IconButton>
          )}
          <IconButton size="large" color="secondary">
            <SettingsApplicationsIcon />
          </IconButton>
          <IconButton color="primary" size="large" onClick={() => onNewChat()}>
            <AddIcon />
          </IconButton>
        </Stack>
      </Toolbar>
      {loading && <LinearProgress />}
      {generating && <LinearProgress color="success" />}
    </AppBarStyled>
  );
}

export default TopBar;
