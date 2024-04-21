import React, { useContext, useEffect, useState, useCallback } from "react";

export const BackendContext = React.createContext({});

export const BASE_URL = "https://astro.sshh.io";
export const APP_VERSION = "0.3.0";
const API_ENDPOINT = "https://sshh12--llm-chat-stream-backend.modal.run/";
const API_KEY_KEY = "llmchat:apiKey";
const CACHED_USER_KEY = "llmchat:cachedUser";

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

export function useBackendControl() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [cachedUser, _setCachedUser] = useState(null);

  const setCachedUser = (cachedUser) => {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(cachedUser));
    _setCachedUser(cachedUser);
  };

  const postThenUpdateUser = useCallback((func, args = {}) => {
    setReady(false);
    return post(func, args)
      .then((result) => {
        if (result.error) {
          alert("Error " + result.error);
          return { error: result.error };
        }
        return post("get_user")
          .then((user) => {
            if (user.error) {
              alert("Error " + user.error);
              return { error: user.error };
            }
            setReady(true);
            setUser(user);
            setCachedUser(user);
            return { result, user };
          })
          .catch((e) => {
            setReady(true);
            alert("Error " + e);
            return { error: e };
          });
      })
      .catch((e) => {
        setReady(true);
        return { error: e };
      });
  }, []);

  useEffect(() => {
    if (window.initRunning) {
      return;
    }
    window.initRunning = true;
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
    postThenUpdateUser,
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
  const key = `llmchat:cache:${func}:${argsStr}`;
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
  return { ready, result };
}
