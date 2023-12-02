import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Snackbar } from "@mui/material";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

export default function ShareDialog({ open, setOpen, isPublic, setPublic }) {
  const [showCopied, setShowCopied] = React.useState(false);
  const shareURL = window.location.href;

  const onCopy = () => {
    navigator.clipboard.writeText(shareURL);
    setShowCopied(true);
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={showCopied}
        autoHideDuration={2000}
        onClose={() => setShowCopied(false)}
        message="Share URL Copied!"
      />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Share Chat</DialogTitle>
        <DialogContent>
          {!isPublic && (
            <Typography>This chat is currently private.</Typography>
          )}
          {isPublic && (
            <TextField
              sx={{ marginTop: "1rem" }}
              label="Share URL"
              fullWidth
              value={shareURL}
              onClick={() => onCopy()}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
          {isPublic && (
            <Button
              onClick={() => {
                setPublic(false);
                setOpen(false);
              }}
            >
              Make Private
            </Button>
          )}
          {!isPublic && (
            <Button
              onClick={() => {
                onCopy();
                setPublic(true);
              }}
            >
              Make Public
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
