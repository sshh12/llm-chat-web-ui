import * as React from "react";
import Chat from "./Chat";
import HistoryDrawer from "./HistoryDrawer";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import TopBar from "./TopBar";
import { useDefaultPersistentGet, useUpdate } from "../api";
import SettingsDialog, { fixSettings } from "./SettingsDialog";

function ChatView({ theme }) {
  const urlChatID =
    new URLSearchParams(window.location.search).get("chatId") || null;
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [curChatId, setCurChatId] = React.useState(urlChatID);
  const [generating, setGenerating] = React.useState(false);
  const [openSettings, setOpenSettings] = React.useState(false);

  const [loadingUser, user, setUser] = useDefaultPersistentGet(
    "user",
    "/get-user"
  );
  const [loadingChat, curChat, setCurChat] = useDefaultPersistentGet(
    "chat:" + curChatId,
    "/get-chat",
    "chatId=" + curChatId
  );
  const [updateChat, loadingUpdateChat] = useUpdate("/update-chat");
  const [updateUser, loadingUpdateUser] = useUpdate("/update-user");
  const loading =
    loadingUser || loadingChat || loadingUpdateChat || loadingUpdateUser;

  const onChatUpdate = (messages) => {
    updateChat({ id: curChatId, messages: messages }).then((chat) => {
      setCurChatId(chat.id);
      setCurChat(() => chat);
      window.history.pushState({}, "", "?chatId=" + chat.id);
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
    updateChat({ id: curChatId, doDelete: true }).then((chat) => {
      setCurChatId(null);
      window.history.pushState({}, "", "/");
      setUser((user) => ({
        ...user,
        chats: user.chats.filter((c) => c.id !== chatId),
      }));
    });
  };

  const onNewChat = () => {
    setCurChatId(null);
    window.history.pushState({}, "", "/");
  };

  const onUpdatedSettings = (settings, setDefault) => {
    setCurChat((chat) => ({ ...chat, chatSettings: settings }));
    if (curChatId !== null) {
      updateChat({ id: curChatId, chatSettings: settings });
    }
    if (setDefault) {
      setUser((user) => ({ ...user, chatSettings: settings }));
      updateUser({ chatSettings: settings });
    }
  };

  const settings = fixSettings(
    Object.assign({}, user?.chatSettings || {}, curChat?.chatSettings || {})
  );

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
      <SettingsDialog
        settings={settings}
        onUpdatedSettings={onUpdatedSettings}
        open={openSettings}
        setOpen={setOpenSettings}
      />
      <Chat
        historyOpen={historyOpen}
        onChatUpdate={onChatUpdate}
        curChat={curChat}
        setGenerating={setGenerating}
        setOpenSettings={setOpenSettings}
        settings={settings}
      />
    </Box>
  );
}

export default ChatView;
