import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import { postAudioStream } from "../backend";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default function VoiceChatDialog({ open, setOpen, settings }) {
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [generating, setGenerating] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [latestResponse, setLatestResponse] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      SpeechRecognition.startListening();
    } else {
      setMessages([]);
      setLatestResponse(null);
      SpeechRecognition.stopListening();
    }
  }, [open]);

  const onSubmit = React.useCallback(
    (newMessage) => {
      const newMessages = messages.concat([newMessage]);
      setGenerating(true);
      setLatestResponse(null);
      postAudioStream(
        "stream_chat_audio",
        {
          messages: newMessages,
          settings: settings,
        },
        ({ content }) => {
          setLatestResponse(content);
        },
        ({ content }) => {
          setGenerating(false);
          setMessages(
            newMessages.concat([{ role: "assistant", content: content }])
          );
          setLatestResponse(content);
          SpeechRecognition.startListening();
        }
      );
    },
    [messages, settings]
  );

  React.useEffect(() => {
    if (transcript && !listening) {
      SpeechRecognition.stopListening();
      onSubmit({ role: "user", content: transcript });
      resetTranscript();
    }
  }, [transcript, listening, onSubmit, resetTranscript]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={(e) => {
          if (!e.target.value === "backdropClick") {
            setOpen(false);
          }
        }}
        fullWidth
      >
        <DialogTitle>Conversation</DialogTitle>
        <DialogContent>
          {generating && (
            <LinearProgress color="success" sx={{ marginBottom: "1rem" }} />
          )}
          {listening && (
            <LinearProgress color="secondary" sx={{ marginBottom: "1rem" }} />
          )}
          {listening && <Typography>{transcript}</Typography>}
          {!listening && (
            <Typography>
              <i>{latestResponse}</i>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {listening && !generating && (
            <Button
              color="warning"
              onClick={() => {
                SpeechRecognition.stopListening();
              }}
            >
              Stop Listening
            </Button>
          )}
          {!listening && !generating && (
            <Button
              color="secondary"
              onClick={() => {
                SpeechRecognition.startListening();
              }}
            >
              Start Listening
            </Button>
          )}
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
