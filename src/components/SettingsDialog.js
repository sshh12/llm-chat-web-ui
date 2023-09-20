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

const MODELS = ["openai:gpt-3.5-turbo", "openai:gpt-4"];

export function fixSettings(settings) {
  if (settings === null) {
    settings = {};
  }
  if (!settings.model) {
    settings.model = MODELS[0];
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
