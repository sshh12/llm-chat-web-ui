import * as React from "react";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import SendIcon from "@mui/icons-material/Send";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import Stack from "@mui/material/Stack";
import ChatMessage from "./ChatMessage.js";
import { streamGenerate } from "../modal.js";

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const drawerWidth = 240;

const Main = styled(
  "main",
  {}
)(({ theme, historyOpen }) => ({
  flexGrow: 1,
  padding: 0,
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(historyOpen && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

function Chat({
  historyOpen,
  appendMessage,
  chat,
  setGenerating,
  setOpenSettings,
  settings,
}) {
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [latestChat, setLatestChat] = React.useState(null);
  const [alert, setAlert] = React.useState(null);

  const submitMessage = () => {
    const chatQuery = [
      ...chat.messages.map((c) => ({ role: c.role, content: c.text })),
      { role: "user", content: message },
    ];
    appendMessage({
      role: "user",
      text: message,
    });
    setLatestChat({
      role: "assistant",
      text: "",
    });
    setLoading(true);
    setGenerating(true);
    setTimeout(() => {
      window.scrollBy(0, 1000);
      streamGenerate(
        chatQuery,
        settings,
        (content, alert) => {
          setAlert(alert);
          window.scrollBy(0, 1000);
          setLatestChat({
            role: "assistant",
            text: content,
          });
        },
        (content) => {
          appendMessage({
            role: "assistant",
            text: content,
          });
          setLatestChat(null);
          setAlert(null);
          setLoading(false);
          setGenerating(false);
        }
      );
    }, 10);
    setMessage("");
  };

  let messages = [...chat.messages];
  if (latestChat !== null) {
    messages.push(latestChat);
  }

  return (
    <Main open={historyOpen}>
      <DrawerHeader />
      {messages.map((chatMessage, i) => (
        <ChatMessage
          key={i}
          chatMessage={chatMessage}
          alert={i === messages.length - 1 ? alert : null}
        />
      ))}
      <Box height={"9rem"}></Box>
      <Paper
        elevation={2}
        sx={{
          p: "9px 7px",
          display: "flex",
          alignItems: "center",
          width: "100%",
          position: "fixed",
          bottom: 0,
        }}
      >
        <TextField
          label="Message"
          fullWidth
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message here..."
          onKeyDown={(e) => {
            if (e.keyCode === 13 && !e.ctrlKey) {
              e.preventDefault();
              submitMessage();
            }
          }}
        />
        <Divider orientation="vertical" />
        <Stack>
          <IconButton
            color="primary"
            onClick={submitMessage}
            disabled={loading || message.length === 0}
          >
            <SendIcon sx={{ fontSize: "2rem" }} />
          </IconButton>
          <IconButton color="secondary" onClick={() => setOpenSettings(true)}>
            <SettingsApplicationsIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Main>
  );
}

export default Chat;
