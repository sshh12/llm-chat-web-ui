import * as React from "react";
import { styled } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

const drawerWidth = 240;

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

function HistoryDrawer({
  open,
  handleDrawerClose,
  theme,
  user,
  onSelectChat,
  selectedChatId,
}) {
  const chatsSorted = (user?.chats || []).sort(
    (a, b) => -a.createdAt.localeCompare(b.createdAt)
  );
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === "ltr" ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {chatsSorted.map((chat) => (
          <ListItem key={chat.id} disablePadding>
            <ListItemButton onClick={() => onSelectChat(chat.id)}>
              {selectedChatId === chat.id && (
                <ListItemText primary={<b>{chat.name}</b>} />
              )}
              {selectedChatId !== chat.id && (
                <ListItemText primary={chat.name} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
export default HistoryDrawer;
