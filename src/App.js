import "./App.css";
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
  const [apiKey] = React.useState(localStorage.getItem("llmchat:apiKey"));
  React.useEffect(() => {
    const apiKey = new URLSearchParams(window.location.search).get("key");
    if (apiKey) {
      localStorage.setItem("llmchat:apiKey", apiKey.trim());
      window.location = "/";
    }
  }, []);
  return (
    <ThemeProvider theme={darkTheme}>
      <LoginDialog open={apiKey === null} />
      <ChatView theme={darkTheme} />
    </ThemeProvider>
  );
}

export default App;
