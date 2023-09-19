import * as React from "react";

const BASE_URL = "http://localhost:9999";
const API_KEY_KEY = "llmchat:apiKey";

export function useDefaultPersistentGet(key, path, extraParams = "unused=1") {
  const fullKey = "llmchat:" + key;
  const [values, setValues] = React.useState(
    JSON.parse(localStorage.getItem(fullKey))
  );
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const store = localStorage.getItem(fullKey);
    setLoading(true);
    fetch(
      `${BASE_URL}/.netlify/functions${path}?apiKey=${localStorage.getItem(
        API_KEY_KEY
      )}&${extraParams}`
    )
      .then((resp) => resp.json())
      .then((values) => {
        setValues(values);
        localStorage.setItem(fullKey, JSON.stringify(values));
        setLoading(false);
      })
      .catch(() => {
        setValues(JSON.parse(store));
        setLoading(false);
      });
  }, [path, fullKey, extraParams]);
  const setValue = (newValue) => {
    const newValueComputed = newValue(values);
    setValues(newValueComputed);
    localStorage.setItem(fullKey, JSON.stringify(newValueComputed));
  };
  return [loading, values, setValue];
}

export function useUpdate(path) {
  const update = (newValue) => {
    return fetch(`${BASE_URL}/.netlify/functions${path}`, {
      method: "POST",
      body: JSON.stringify({
        ...newValue,
        apiKey: localStorage.getItem(API_KEY_KEY),
      }),
    }).then((resp) => resp.json());
  };
  return [update];
}
