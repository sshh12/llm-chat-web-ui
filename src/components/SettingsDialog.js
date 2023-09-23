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
import Box from "@mui/material/Box";

const MODELS = [
  "openai_functions:gpt-4",
  "openai_functions:gpt-3.5-turbo",
  "openai:gpt-4",
  "openai:gpt-3.5-turbo",
  "stablediffusion:xl",
  "vllm_hf:meta-llama/Llama-2-13b-chat-hf",
];

const DEFAULT_SYSTEM_PROMPT = `You are Chat LLM, an expert large language model. Current date and time: {{ datetime }}, you are talking to {{ name }}. Use markdown in your response.`;

export function fixSettings(settings) {
  if (settings === null) {
    settings = {};
  }
  if (!settings.model) {
    settings.model = MODELS[0];
  }
  if (!settings.temperature) {
    settings.temperature = 0.0;
  }
  if (!settings.systemPrompt) {
    settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  }
  return settings;
}

export default function SettingsDialog({
  settings,
  onUpdatedSettings,
  open,
  setOpen,
}) {
  return (
    <div>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Chat Settings</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginTop: "10px" }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={settings.model}
              label="Model"
              onChange={(e) => {
                onUpdatedSettings(
                  { ...settings, model: e.target.value },
                  false
                );
              }}
            >
              {MODELS.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
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
