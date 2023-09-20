const CHAT_ENDPOINT = "https://sshh12--llm-chat-web-ui-generate.modal.run/";

export function streamGenerate(chatQuery, settings, onContent, onComplete) {
  const args = {
    chat: chatQuery,
    apiKey: localStorage.getItem("llmchat:apiKey"),
    ...settings,
  };
  fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  }).then(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let result = "";
    let content = "";
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
          content += jsonObject.content;
          onContent(content);
        }

        endOfMessageIndex = result.indexOf("\n");
      }
    }
    onComplete();
  });
}
