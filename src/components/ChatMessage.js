import * as React from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Snackbar } from "@mui/material";
import Stack from "@mui/material/Stack";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import CodeIcon from "@mui/icons-material/Code";
import CreateIcon from "@mui/icons-material/Create";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import Alert from "@mui/material/Alert";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark as dark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ChatMessage({
  chatMessage,
  canEdit,
  alert,
  onUpdateText,
  loading,
}) {
  const [showCopied, setShowCopied] = React.useState(false);
  const [editText, setEditText] = React.useState(null);
  const showEdit = editText !== null;

  const onCopy = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
  };

  const onEdit = () => {
    if (editText !== chatMessage.content) {
      onUpdateText(editText);
    }
    setEditText(null);
  };

  const codeBlocks = [];
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g;
  let match;
  while ((match = codeBlockRegex.exec(chatMessage.content))) {
    codeBlocks.push(match[2]);
  }

  return (
    <Card
      sx={{
        width: "98vw",
        margin: "0px 0px",
        boxShadow: "0px 1px 1px -1px rgba(0,0,0,0.2)",
        backgroundColor: chatMessage.role === "user" ? "#1e1e1e" : "#101010",
      }}
      raised={false}
    >
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={showCopied}
        autoHideDuration={2000}
        onClose={() => setShowCopied(false)}
        message="Copied!"
      />
      <CardContent>
        <Stack direction={"row"} justifyContent="space-between">
          <Typography sx={{ fontSize: "0.8rem", color: "#eee" }} gutterBottom>
            {chatMessage.role}
          </Typography>
          {!showEdit && (
            <Box>
              {canEdit && !loading && chatMessage.role === "user" && (
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setEditText(chatMessage.content)}
                >
                  <CreateIcon sx={{ fontSize: "1.4rem" }} />
                </IconButton>
              )}
              {chatMessage.role === "assistant" && codeBlocks.length > 0 && (
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onCopy(codeBlocks.join("\n\n"))}
                >
                  <CodeIcon sx={{ fontSize: "1.4rem" }} />
                </IconButton>
              )}
              <IconButton
                size="small"
                color="primary"
                onClick={() => onCopy(chatMessage.content)}
              >
                <ContentPasteIcon sx={{ fontSize: "1.4rem" }} />
              </IconButton>
            </Box>
          )}
          {showEdit && (
            <Box>
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  onEdit();
                }}
              >
                <SaveIcon sx={{ fontSize: "1.4rem" }} />
              </IconButton>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setEditText(null)}
              >
                <CancelIcon sx={{ fontSize: "1.4rem" }} />
              </IconButton>
            </Box>
          )}
        </Stack>
        <Box sx={{ marginBottom: "-10px", overflowX: "hidden" }}>
          {alert && <Alert severity="info">{alert}</Alert>}
          {!showEdit && (
            <ReactMarkdown
              className="chat-markdown"
              style={{ overflow: "hidden" }}
              children={chatMessage.content}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, "")}
                      style={dark}
                      language={match[1]}
                      PreTag="div"
                    />
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
            />
          )}
          {showEdit && (
            <Box>
              <TextField
                fullWidth
                multiline
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Message"
                onKeyDown={(e) => {
                  if (e.keyCode === 13 && !e.ctrlKey) {
                    e.preventDefault();
                    onEdit();
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
