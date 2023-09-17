import "./App.css";
import * as React from "react";
import Chat from "./components/Chat";
import HistoryDrawer from "./components/HistoryDrawer";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import TopBar from "./components/TopBar";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setHistoryOpen(true);
  };

  const handleDrawerClose = () => {
    setHistoryOpen(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <TopBar historyOpen={historyOpen} handleDrawerOpen={handleDrawerOpen} />
        <HistoryDrawer
          open={historyOpen}
          handleDrawerClose={handleDrawerClose}
          theme={darkTheme}
        />
        <Chat historyOpen={historyOpen} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
