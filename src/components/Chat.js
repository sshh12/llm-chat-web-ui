import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import ShareIcon from "@mui/icons-material/Share";
import Box from "@mui/material/Box";
import SendIcon from "@mui/icons-material/Send";

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

function Chat({ historyOpen }) {
  return (
    <Main open={historyOpen}>
      <DrawerHeader />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card
          sx={{
            width: "100%",
            margin: "4px 0px",
            boxShadow: "0px 1px 1px -1px rgba(0,0,0,0.2)",
          }}
          raised={false}
        >
          <CardContent>
            <Typography sx={{ fontSize: 10 }} color="subtitle1" gutterBottom>
              ChatGPT
            </Typography>
            <Typography variant="body1">
              well meaning and kindly. {i}
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton size="small">
              <ShareIcon sx={{ fontSize: "1rem" }} />
            </IconButton>
          </CardActions>
        </Card>
      ))}
      <Box height={"8rem"}></Box>
      <Paper
        elevation={2}
        sx={{
          p: "6px 6px",
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
          placeholder="Enter a message here..."
        />
        <Divider orientation="vertical" />
        <IconButton color="primary">
          <SendIcon sx={{ fontSize: "2rem" }} />
        </IconButton>
      </Paper>
    </Main>
  );
}

export default Chat;
