import * as React from "react";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:9999"
    : process.env.PUBLIC_URL;
const API_KEY_KEY = "llmchat:apiKey";

export function useGet(path, extraParams = "") {
  const [values, setValues] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    let url = `${BASE_URL}/.netlify/functions${path}?apiKey=${localStorage.getItem(
      API_KEY_KEY
    )}`;
    if (extraParams) {
      url += `&${extraParams}`;
    }
    fetch(url)
      .then((resp) => resp.json())
      .then((values) => {
        setValues(values);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [path, extraParams]);
  const setValue = (newValueFunc) => {
    setValues(newValueFunc);
  };
  return [loading, values, setValue];
}

export function useUpdate(path) {
  const [loading, setLoading] = React.useState(false);
  const update = (newValue) => {
    setLoading(true);
    return fetch(`${BASE_URL}/.netlify/functions${path}`, {
      method: "POST",
      body: JSON.stringify({
        ...newValue,
        apiKey: localStorage.getItem(API_KEY_KEY),
      }),
    }).then((resp) => {
      setLoading(false);
      return resp.json();
    });
  };
  return [update, loading];
}
