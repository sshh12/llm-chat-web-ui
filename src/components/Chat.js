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
import { useBackend } from "../backend.js";

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
  onChatGenerated,
  chat,
  setGenerating,
  setOpenSettings,
  settings,
  resetChat,
}) {
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [latestChat, setLatestChat] = React.useState([]);
  const [alert, setAlert] = React.useState(null);
  const { postStream } = useBackend();

  const submitMessage = (newUserMessage, chatMessages) => {
    const promptMessages = [
      ...chatMessages,
      { role: "user", content: newUserMessage },
    ];
    setLatestChat([
      {
        role: "user",
        content: newUserMessage,
      },
      {
        role: "assistant",
        content: "",
      },
    ]);
    setLoading(true);
    setGenerating(true);
    const setLatestContent = (content) => {
      setLatestChat((latestChat) => {
        const newLatestChat = [...latestChat];
        newLatestChat[newLatestChat.length - 1].text = content;
        return newLatestChat;
      });
    };
    setTimeout(() => {
      window.scrollBy(0, 1000);
      postStream(
        "stream_chat",
        { id: chat.id || "", messages: promptMessages, settings: settings },
        (streamData) => {
          setAlert(streamData.alert || null);
          setLatestContent(streamData.content || "");
        },
        (streamData) => {
          onChatGenerated(
            promptMessages.concat([
              {
                role: "assistant",
                content: streamData.content,
              },
            ])
          );
          setLatestChat([]);
          setAlert(null);
          setLoading(false);
          setGenerating(false);
        }
      );
    }, 10);
    setMessage("");
  };

  let messages = [...chat.messages];
  if (latestChat.length > 0) {
    messages.push(...latestChat);
  }

  return (
    <Main open={historyOpen}>
      <DrawerHeader />
      {messages.map((chatMessage, i) => (
        <ChatMessage
          key={i}
          canEdit={!chat.isGuest}
          chatMessage={chatMessage}
          loading={loading}
          alert={i === messages.length - 1 ? alert : null}
          onUpdateText={(text) => {
            resetChat(i).then((chat) => submitMessage(text, chat.messages));
          }}
        />
      ))}
      {!chat.isGuest && (
        <>
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
                if (
                  settings.submitOnEnter &&
                  e.keyCode === 13 &&
                  !e.ctrlKey &&
                  !loading
                ) {
                  e.preventDefault();
                  submitMessage(message, chat.messages);
                }
              }}
            />
            <Divider orientation="vertical" />
            <Stack>
              <IconButton
                color="primary"
                onClick={() => submitMessage(message, chat.messages)}
                disabled={loading || message.length === 0}
              >
                <SendIcon sx={{ fontSize: "2rem" }} />
              </IconButton>
              <IconButton
                color="secondary"
                onClick={() => setOpenSettings(true)}
              >
                <SettingsApplicationsIcon />
              </IconButton>
            </Stack>
          </Paper>
        </>
      )}
    </Main>
  );
}

export default Chat;
