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
    const model = models.find((m) => m.includes("gpt-4-turbo"));
    settings.modelKey = model.key;
  }
  if (!settings.temperature) {
    settings.temperature = 0.0;
  }
  if (!settings.systemPrompt) {
    settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  }
  if (settings.submitOnEnter === undefined) {
    settings.submitOnEnter = true;
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
  return (
    <div>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Chat Settings</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: "10px" }}>
            <InputLabel>Agent</InputLabel>
            <Select
              value={settings.modelKey}
              label="Agent"
              onChange={(e) => {
                onUpdatedSettings(
                  { ...settings, modelKey: e.target.value },
                  false
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
            value={settings.systemPrompt}
            onChange={(e) => {
              onUpdatedSettings(
                { ...settings, systemPrompt: e.target.value },
                false
              );
            }}
            placeholder="System Prompt"
          />
          <Box sx={{ paddingTop: "3rem" }}>
            <Typography gutterBottom sx={{ fontSize: 12, color: "#eee" }}>
              Temperature
            </Typography>
            <Slider
              value={settings.temperature}
              onChange={(e) => {
                onUpdatedSettings(
                  { ...settings, temperature: e.target.value },
                  false
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
              checked={settings.submitOnEnter}
              onChange={(e) => {
                onUpdatedSettings(
                  { ...settings, submitOnEnter: e.target.checked },
                  false
                );
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              onUpdatedSettings(settings, true);
            }}
          >
            Set As Default
          </Button>
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
