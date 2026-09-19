chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PLUGGY_TOKEN") {
    chrome.storage.local.set({ pluggyToken: msg.token, capturedAt: Date.now() });
  }
  if (msg.type === "GET_STATUS") {
    chrome.storage.local.get(["pluggyToken", "capturedAt", "paired"], (data) => {
      sendResponse(data);
    });
    return true;
  }
  if (msg.type === "PAIR") {
    const appUrl = msg.appUrl;
    const deviceToken = msg.deviceToken;
    chrome.storage.local.get("pluggyToken", async (data) => {
      if (!data.pluggyToken) {
        sendResponse({ error: "Nenhum token do Pluggy capturado. Abra meu.pluggy.ai e navegue." });
        return;
      }
      try {
        const res = await fetch(`${appUrl}/api/pluggy/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deviceToken}`,
          },
          body: JSON.stringify({ token: data.pluggyToken }),
        });
        const json = await res.json();
        if (res.ok) {
          chrome.storage.local.set({ paired: true });
          sendResponse({ success: true, itemCount: json.itemCount });
        } else {
          sendResponse({ error: json.error ?? "Falha ao parear." });
        }
      } catch {
        sendResponse({ error: "Não foi possível conectar ao TabelhaFin." });
      }
    });
    return true;
  }
});
