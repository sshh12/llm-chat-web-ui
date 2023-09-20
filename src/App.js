import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ChatView from "./components/ChatView";
import LoginDialog from "./components/LoginDialog";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const urlParams = React.useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const [apiKey] = React.useState(localStorage.getItem("llmchat:apiKey"));
  React.useEffect(() => {
    const apiKey = urlParams.get("key");
    if (apiKey) {
      localStorage.setItem("llmchat:apiKey", apiKey.trim());
      window.location = "/";
    }
  }, [urlParams]);
  return (
    <ThemeProvider theme={darkTheme}>
      <LoginDialog open={apiKey === null && !urlParams.get("chatId")} />
      <ChatView theme={darkTheme} />
    </ThemeProvider>
  );
}

export default App;
