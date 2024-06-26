import React, { useContext, useEffect, useState, useCallback } from "react";

export const BackendContext = React.createContext({});

export const BASE_URL = "https://astro.sshh.io";
export const APP_VERSION = "0.3.0";
const API_ENDPOINT =
  new URLSearchParams(window.location.search).get("server") ||
  "https://sshh12--llm-chat-stream-backend.modal.run/";
const API_KEY_KEY = "llmchat2:apiKey";
const CACHED_USER_KEY = "llmchat2:cachedUser";

function post(func, args = {}) {
  return fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      func: func,
      args: args,
      api_key: localStorage.getItem(API_KEY_KEY) || "",
    }),
  }).then((response) => response.json());
}

export function postStream(func, args, onContent, onComplete) {
  fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      func: func,
      args: args,
      api_key: localStorage.getItem(API_KEY_KEY) || "",
    }),
  }).then(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let result = "";
    let data;
    let cumulatedData = {};

    while (!(data = await reader.read()).done) {
      result += decoder.decode(data.value || new Uint8Array(), {
        stream: true,
      });
      let endOfMessageIndex = result.indexOf("\n");

      while (endOfMessageIndex !== -1) {
        const message = result.substring(0, endOfMessageIndex);
        result = result.substring(endOfMessageIndex + 1);

        if (message) {
          const jsonObject = JSON.parse(message);
          for (let key in jsonObject) {
            const isAppend = key.startsWith("append:");
            const dataKey = isAppend ? key.substring(7) : key;

            if (isAppend) {
              if (jsonObject[key]) {
                if (!cumulatedData[dataKey]) {
                  cumulatedData[dataKey] = "";
                }
                cumulatedData[dataKey] += jsonObject[key];
              }
            } else {
              cumulatedData[dataKey] = jsonObject[key];
            }
          }
          onContent(cumulatedData);
        }

        endOfMessageIndex = result.indexOf("\n");
      }
    }
    onComplete(cumulatedData);
  });
}

export function postAudioStream(func, args, onContent, onComplete) {
  if (!window.MediaSource) {
    console.error("MediaSource API is not supported in this browser");
    return;
  }

  const mediaSource = new MediaSource();
  const audio = new Audio();
  audio.src = URL.createObjectURL(mediaSource);
  let content = "";

  mediaSource.addEventListener("sourceopen", async () => {
    try {
      const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
      const waitForUpdateEnd = () =>
        new Promise((resolve) => {
          sourceBuffer.addEventListener("updateend", resolve);
        });
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          func: func,
          args: args,
          api_key: localStorage.getItem(API_KEY_KEY) || "",
        }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let result = "";
      let data;

      while (!(data = await reader.read()).done) {
        result += decoder.decode(data.value || new Uint8Array(), {
          stream: true,
        });
        let endOfMessageIndex = result.indexOf("\n");

        while (endOfMessageIndex !== -1) {
          const message = result.substring(0, endOfMessageIndex);
          result = result.substring(endOfMessageIndex + 1);

          if (message) {
            const jsonObject = JSON.parse(message);
            content = jsonObject.content;
            const audioBytes = Uint8Array.from(atob(jsonObject.audio), (c) =>
              c.charCodeAt(0)
            );
            if (sourceBuffer.updating) {
              await waitForUpdateEnd();
            }
            sourceBuffer.appendBuffer(audioBytes.buffer);
            onContent({ content: content });
          }
          endOfMessageIndex = result.indexOf("\n");
        }
      }
      if (sourceBuffer.updating) {
        await waitForUpdateEnd();
      }
      try {
        mediaSource.endOfStream();
      } catch (error) {
        console.warn("Error closing the source buffer:", error);
      }
    } catch (error) {
      console.warn("Error fetching or processing the audio stream:", error);
      mediaSource.endOfStream("network");
    }
  });
  audio.play().catch((error) => console.error("Error playing audio:", error));
  audio.addEventListener("ended", () => {
    onComplete({ content: content });
  });
}

export function useBackendControl() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [cachedUser, _setCachedUser] = useState(null);

  const setCachedUser = (cachedUser) => {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(cachedUser));
    _setCachedUser(cachedUser);
  };

  const update = useCallback((func, args, newTempVal) => {
    setReady(false);
    setUser(newTempVal);
    if (!func) {
      setReady(true);
      return null;
    }
    return post(func, args).then((val) => {
      if (!val.error) {
        setCachedUser(val);
        setReady(true);
      }
      return val;
    });
  }, []);

  useEffect(() => {
    if (window.initRunning) {
      return;
    }
    window.initRunning = true;
    if (localStorage.getItem(CACHED_USER_KEY)) {
      _setCachedUser(JSON.parse(localStorage.getItem(CACHED_USER_KEY)));
    }
    post("get_user")
      .then((user) => {
        setReady(true);
        setUser(user);
        setCachedUser(user);
      })
      .catch((e) => {
        setReady(true);
      });
  }, []);

  const userObj = user || cachedUser;

  return {
    user: userObj,
    ready,
    post,
    postStream,
    update,
  };
}

export function useBackend() {
  const api = useContext(BackendContext);
  return api;
}

export function usePostWithCache(func, args = {}) {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState(null);
  const argsStr = args && JSON.stringify(args);
  const key = `llmchat2:cache:${func}:${argsStr}`;
  const update = useCallback(
    (func, args, newTempVal) => {
      setReady(false);
      setResult(newTempVal);
      if (!func) {
        setReady(true);
        return null;
      }
      return post(func, args).then((val) => {
        if (!val.error) {
          localStorage.setItem(key, JSON.stringify(val));
          setResult(val);
          setReady(true);
        }
        return val;
      });
    },
    [key]
  );
  useEffect(() => {
    if (func && argsStr !== null) {
      if (localStorage.getItem(key)) {
        setResult(JSON.parse(localStorage.getItem(key)));
      }
      post(func, JSON.parse(argsStr)).then((val) => {
        if (!val.error) {
          localStorage.setItem(key, JSON.stringify(val));
          setResult(val);
          setReady(true);
        }
      });
    } else {
      setReady(true);
      setResult(null);
    }
  }, [func, argsStr, key]);
  return { ready, result, update };
}
