import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import { useBackend } from "../backend";

const DEFAULT_SYSTEM_PROMPT = `You are Chat LLM, an expert large language model. Current date and time: {{ datetime }}, you are talking to {{ name }}. Use markdown in your response.`;

export function fixSettings(settings, models) {
  if (settings === null) {
    settings = {};
  }
  if (
    models &&
    (!settings.modelKey || !models.find((m) => m.key === settings.modelKey))
  ) {
    const model = models.find(
      (m) => m.key.includes("gpt-4-turbo") && m.key.includes("Tools")
    );
    settings.modelKey = model.key;
  }
  if (settings.temperature === undefined) {
    settings.temperature = 0.0;
  }
  if (settings.systemPrompt === undefined) {
    settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  }
  if (settings.submitOnEnter === undefined) {
    settings.submitOnEnter = true;
  }
  if (settings.submitOnVoice === undefined) {
    settings.submitOnVoice = false;
  }
  return settings;
}

export default function SettingsDialog({
  settings,
  onUpdatedSettings,
  open,
  setOpen,
}) {
  const { user } = useBackend();
  const [editSettings, setEditSettings] = React.useState(settings);
  React.useEffect (() => {
    setEditSettings(settings);
  }, [settings]);
  return (
    <div>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Chat Settings</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: "10px" }}>
            <InputLabel>Agent</InputLabel>
            <Select
              value={editSettings.modelKey}
              label="Agent"
              onChange={(e) => {
                setEditSettings(
                  { ...settings, modelKey: e.target.value },
             
                );
              }}
            >
              {user &&
                user.models.map((model) => (
                  <MenuItem key={model.key} value={model.key}>
                    {model.key}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            sx={{ marginTop: "3rem" }}
            label="System Prompt"
            fullWidth
            multiline
            rows={4}
            value={editSettings.systemPrompt}
            onChange={(e) => {
              setEditSettings(
                { ...settings, systemPrompt: e.target.value },
              );
            }}
            placeholder="System Prompt"
          />
          <Box sx={{ paddingTop: "3rem" }}>
            <Typography gutterBottom sx={{ fontSize: 12, color: "#eee" }}>
              Temperature
            </Typography>
            <Slider
              value={editSettings.temperature}
              onChange={(e) => {
                setEditSettings(
                  { ...settings, temperature: e.target.value },
                );
              }}
              step={0.1}
              max={1.0}
            />
          </Box>
          <Box sx={{ paddingTop: "1rem" }}>
            <Typography gutterBottom sx={{ fontSize: 12, color: "#eee" }}>
              Submit On Enter
            </Typography>
            <Checkbox
              checked={editSettings.submitOnEnter}
              onChange={(e) => {
                setEditSettings(
                  { ...settings, submitOnEnter: e.target.checked },
    
                );
              }}
            />
          </Box>
          <Box sx={{ paddingTop: "1rem" }}>
            <Typography gutterBottom sx={{ fontSize: 12, color: "#eee" }}>
              Submit On Voice
            </Typography>
            <Checkbox
              checked={editSettings.submitOnVoice}
              onChange={(e) => {
                setEditSettings(
                  { ...settings, submitOnVoice: e.target.checked },
                );
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              onUpdatedSettings(editSettings, true);
            }}
          >
            Set As Default
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              onUpdatedSettings(editSettings, false);
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
