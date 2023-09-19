import * as React from "react";
import Chat from "./Chat";
import HistoryDrawer from "./HistoryDrawer";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import TopBar from "./TopBar";
import { useDefaultPersistentGet, useUpdate } from "../api";

function ChatView({ theme }) {
  const urlChatID =
    new URLSearchParams(window.location.search).get("chatId") || null;
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [curChatId, setCurChatId] = React.useState(urlChatID);
  const [generating, setGenerating] = React.useState(false);
  const [taskLoading, setTaskLoading] = React.useState(false);

  const [loadingUser, user, setUser] = useDefaultPersistentGet(
    "user",
    "/get-user"
  );
  const [loadingChat, curChat] = useDefaultPersistentGet(
    "chat:" + curChatId,
    "/get-chat",
    "chatId=" + curChatId
  );
  const [updateChat] = useUpdate("/update-chat");
  const loading = loadingUser || loadingChat || taskLoading;

  const onChatUpdate = (messages) => {
    setTaskLoading(true);
    updateChat({ id: curChatId, messages: messages }).then((chat) => {
      setCurChatId(chat.id);
      window.history.pushState({}, "", "?chatId=" + chat.id);
      setTaskLoading(false);
      setUser((user) => ({
        ...user,
        chats: user.chats.filter((c) => c.id !== chat.id).concat([chat]),
      }));
    });
  };

  const onSelectChat = (chatId) => {
    setCurChatId(chatId);
    window.history.pushState({}, "", "?chatId=" + chatId);
  };

  const onDeleteChat = (chatId) => {
    setTaskLoading(true);
    updateChat({ id: curChatId, doDelete: true }).then((chat) => {
      setCurChatId(null);
      window.history.pushState({}, "", "/");
      setTaskLoading(false);
      console.log(
        chatId,
        user.chats.filter((c) => c.id !== chatId)
      );
      setUser((user) => ({
        ...user,
        chats: user.chats.filter((c) => c.id !== chatId),
      }));
    });
  };

  const onNewChat = () => {
    setCurChatId(null);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <TopBar
        loading={loading}
        generating={generating}
        historyOpen={historyOpen}
        handleDrawerOpen={() => setHistoryOpen(true)}
        curChat={curChat}
        onDeleteChat={onDeleteChat}
        onNewChat={onNewChat}
        user={user}
      />
      <HistoryDrawer
        open={historyOpen}
        handleDrawerClose={() => setHistoryOpen(false)}
        theme={theme}
        user={user}
        onSelectChat={onSelectChat}
        selectedChatId={curChatId}
      />
      <Chat
        historyOpen={historyOpen}
        onChatUpdate={onChatUpdate}
        curChat={curChat}
        setGenerating={setGenerating}
      />
    </Box>
  );
}

export default ChatView;
