import * as React from "react";
import Chat from "./Chat";
import HistoryDrawer from "./HistoryDrawer";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import TopBar from "./TopBar";
import SettingsDialog, { fixSettings } from "./SettingsDialog";
import ShareDialog from "./ShareDialog";
import VoiceChatDialog from "./VoiceChatDialog";
import { useBackend, usePostWithCache } from "../backend";

function ChatView({ theme }) {
  const urlChatID =
    new URLSearchParams(window.location.search).get("chatId") || null;
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [chatId, setChatId] = React.useState(urlChatID);
  const [generating, setGenerating] = React.useState(false);
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openShare, setOpenShare] = React.useState(false);
  const [openVoiceChat, setOpenVoiceChat] = React.useState(false);

  const { user, ready: userReady, update: updateUser } = useBackend();
  const {
    result: _chat,
    ready: chatReady,
    update: chatUpdate,
  } = usePostWithCache(chatId && "get_chat", { id: chatId });
  const chat = Object.assign({}, _chat, {
    messages: _chat?.messages || [],
  });
  const settings = fixSettings(
    Object.assign({}, user?.chatSettings || {}, chat?.chatSettings || {}),
    user?.models
  );
  const loading = !userReady || !chatReady || !user?.models;

  const onChatGenerated = (messages) => {
    const newChat = Object.assign({}, chat, {
      messages: messages,
    });
    chatUpdate(
      "update_chat_messages",
      {
        id: newChat.id || "",
        messages: newChat.messages,
        settings: settings,
      },
      newChat
    ).then((newChatRemote) => {
      setChatId(newChatRemote.id);
      window.history.pushState({}, "", "?chatId=" + newChatRemote.id);
      const newUser = Object.assign({}, user, {
        chats: user.chats
          .filter((c) => c.id !== newChatRemote.id)
          .concat([newChatRemote]),
      });
      updateUser(null, {}, newUser);
    });
  };

  const onSelectChat = (chatId) => {
    setChatId(chatId);
    window.history.pushState({}, "", "?chatId=" + chatId);
  };

  const onDeleteChat = (chatId) => {
    setChatId(null);
    window.history.pushState({}, "", "/");
    chatUpdate(
      "delete_chat",
      {
        id: chatId,
      },
      {}
    ).then(() => {
      const newUser = Object.assign({}, user, {
        chats: user.chats.filter((c) => c.id !== chatId),
      });
      updateUser(null, {}, newUser);
    });
  };

  const onNewChat = () => {
    setChatId(null);
    window.history.pushState({}, "", "/");
  };

  const onUpdatedSettings = (settings, setDefault) => {
    const newChat = Object.assign({}, chat, {
      chatSettings: settings,
    });
    chatUpdate(
      newChat.id && "update_chat_settings",
      {
        id: newChat.id || "",
        settings: settings,
      },
      newChat
    );
    if (setDefault) {
      const newUser = Object.assign({}, user, { chatSettings: settings });
      updateUser("update_user_settings", { settings: settings }, newUser);
    }
  };

  const resetChat = (idx) => {
    const newChat = Object.assign({}, chat, {
      messages: chat.messages.slice(0, idx),
    });
    return chatUpdate(
      "update_chat_messages",
      {
        id: newChat.id || "",
        messages: newChat.messages,
        settings: settings,
      },
      newChat
    );
  };

  const setPublic = (isPublic) => {
    if (chatId !== null) {
      chatUpdate("update_chat_public", { id: chatId, public: isPublic });
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
        handleShareOpen={() => setOpenShare(true)}
        chat={chat}
        onDeleteChat={onDeleteChat}
        onNewChat={onNewChat}
        user={user}
        setOpenVoiceChat={setOpenVoiceChat}
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
      <ShareDialog
        open={openShare}
        setOpen={setOpenShare}
        setPublic={setPublic}
        isPublic={chat?.public}
      />
      <VoiceChatDialog
        open={openVoiceChat}
        setOpen={setOpenVoiceChat}
        settings={settings}
      />
      <Chat
        historyOpen={historyOpen}
        onChatGenerated={onChatGenerated}
        chat={chat}
        setGenerating={setGenerating}
        setOpenSettings={setOpenSettings}
        settings={settings}
        resetChat={resetChat}
        enableVoice={!openVoiceChat}
      />
    </Box>
  );
}

export default ChatView;
