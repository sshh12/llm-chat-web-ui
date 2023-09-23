import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
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
  chat,
  onDeleteChat,
  onNewChat,
  loading,
  generating,
  user,
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
          {chat?.name || "Chat"}
        </Typography>
        <Stack direction="row" spacing={0} edge="end">
          {chat?.id && (
            <IconButton
              size="large"
              color="warning"
              onClick={() => onDeleteChat(chat.id)}
            >
              <DeleteIcon />
            </IconButton>
          )}
          {/* {chat?.id && (
            <IconButton size="large" color="success">
              <ShareIcon />
            </IconButton>
          )} */}
          {user && (
            <IconButton
              color="primary"
              size="large"
              onClick={() => onNewChat()}
            >
              <AddIcon />
            </IconButton>
          )}
        </Stack>
      </Toolbar>
      {loading && <LinearProgress />}
      {generating && <LinearProgress color="success" />}
    </AppBarStyled>
  );
}

export default TopBar;
