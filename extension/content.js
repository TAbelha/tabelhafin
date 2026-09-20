(() => {
  const API_HOST = "my-api.pluggy.ai";

  const origFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.includes(API_HOST)) {
      const headers = init?.headers;
      let auth = null;
      if (headers instanceof Headers) {
        auth = headers.get("Authorization");
      } else if (headers && typeof headers === "object") {
        auth = headers["Authorization"] ?? headers["authorization"];
      }
      if (auth) {
        chrome.runtime.sendMessage({
          type: "PLUGGY_TOKEN",
          token: auth.replace(/^Bearer\s+/i, ""),
        });
      }
    }
    return origFetch.apply(this, arguments);
  };

  const origOpen = XMLHttpRequest.prototype.open;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function () {
    this._url = arguments[1];
    this._headers = {};
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (
      this._url?.includes(API_HOST) &&
      name.toLowerCase() === "authorization"
    ) {
      chrome.runtime.sendMessage({
        type: "PLUGGY_TOKEN",
        token: value.replace(/^Bearer\s+/i, ""),
      });
    }
    this._headers[name] = value;
    return origSetHeader.apply(this, arguments);
  };
})();
