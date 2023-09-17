import "./App.css";
import * as React from "react";
import Chat from "./components/Chat";
import HistoryDrawer from "./components/HistoryDrawer";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import TopBar from "./components/TopBar";

function App() {
  const theme = useTheme();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setHistoryOpen(true);
  };

  const handleDrawerClose = () => {
    setHistoryOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <TopBar historyOpen={historyOpen} handleDrawerOpen={handleDrawerOpen} />
      <HistoryDrawer
        open={historyOpen}
        handleDrawerClose={handleDrawerClose}
        theme={theme}
      />
      <Chat historyOpen={historyOpen} />
    </Box>
  );
}

export default App;
