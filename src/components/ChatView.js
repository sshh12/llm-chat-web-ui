import * as React from "react";
import Chat from "./Chat";
import HistoryDrawer from "./HistoryDrawer";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import TopBar from "./TopBar";
import { useGet, useUpdate } from "../api";
import SettingsDialog, { fixSettings } from "./SettingsDialog";

function ChatView({ theme }) {
  const urlChatID =
    new URLSearchParams(window.location.search).get("chatId") || null;
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [chatId, setChatId] = React.useState(urlChatID);
  const [generating, setGenerating] = React.useState(false);
  const [openSettings, setOpenSettings] = React.useState(false);

  const [loadingUser, user, setUser] = useGet("/get-user");
  const [loadingChat, _chat, setChat] = useGet("/get-chat", "chatId=" + chatId);
  const [updateChat, loadingUpdateChat] = useUpdate("/update-chat");
  const [updateUser, loadingUpdateUser] = useUpdate("/update-user");
  const loading =
    loadingUser || loadingChat || loadingUpdateChat || loadingUpdateUser;
  const chat = Object.assign({}, _chat, {
    messages: _chat?.messages || [],
  });
  const settings = fixSettings(
    Object.assign({}, user?.chatSettings || {}, chat?.chatSettings || {})
  );

  const appendMessage = (message) => {
    setChat((chat) => {
      const newChat = {
        id: chat.id,
        messages: chat.messages.concat([message]),
        chatSettings: settings,
      };
      updateChat(newChat).then((newChatRemote) => {
        setChatId(newChatRemote.id);
        setChat(newChatRemote);
        window.history.pushState({}, "", "?chatId=" + newChatRemote.id);
        setUser((user) => ({
          ...user,
          chats: user.chats
            .filter((c) => c.id !== newChatRemote.id)
            .concat([newChatRemote]),
        }));
      });
      return newChat;
    });
  };

  const onSelectChat = (chatId) => {
    setChatId(chatId);
    window.history.pushState({}, "", "?chatId=" + chatId);
  };

  const onDeleteChat = (chatId) => {
    updateChat({ id: chatId, doDelete: true }).then((chat) => {
      setChatId(null);
      window.history.pushState({}, "", "/");
      setUser((user) => ({
        ...user,
        chats: user.chats.filter((c) => c.id !== chatId),
      }));
    });
  };

  const onNewChat = () => {
    setChatId(null);
    window.history.pushState({}, "", "/");
  };

  const onUpdatedSettings = (settings, setDefault) => {
    setChat((chat) => ({ ...chat, chatSettings: settings }));
    if (chatId !== null) {
      updateChat({ id: chatId, chatSettings: settings });
    }
    if (setDefault) {
      setUser((user) => ({ ...user, chatSettings: settings }));
      updateUser({ chatSettings: settings });
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <TopBar
        loading={loading}
        generating={generating}
        historyOpen={historyOpen}
        handleDrawerOpen={() => setHistoryOpen(true)}
        chat={chat}
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
        selectedChatId={chatId}
      />
      <SettingsDialog
        settings={settings}
        onUpdatedSettings={onUpdatedSettings}
        open={openSettings}
        setOpen={setOpenSettings}
      />
      <Chat
        historyOpen={historyOpen}
        appendMessage={appendMessage}
        chat={chat}
        setGenerating={setGenerating}
        setOpenSettings={setOpenSettings}
        settings={settings}
      />
    </Box>
  );
}

export default ChatView;
