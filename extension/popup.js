const $ = (s) => document.querySelector(s);

function updateStatus(data) {
  const el = $("#status");
  if (data.paired) {
    el.className = "status ok";
    el.textContent = "Pareado com TabelhaFin";
  } else if (data.pluggyToken) {
    el.className = "status warn";
    el.textContent = "Token Pluggy capturado. Pareie com TabelhaFin.";
  } else {
    el.className = "status err";
    el.textContent = "Nenhum token. Abra meu.pluggy.ai e navegue.";
  }
}

chrome.runtime.sendMessage({ type: "GET_STATUS" }, updateStatus);

$("#refreshBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, updateStatus);
});

$("#pairBtn").addEventListener("click", () => {
  const appUrl = $("#appUrl").value.trim().replace(/\/$/, "");
  const deviceToken = $("#deviceToken").value.trim();
  if (!appUrl || !deviceToken) {
    $("#result").className = "result err";
    $("#result").textContent = "Preencha URL e device token.";
    return;
  }
  $("#pairBtn").disabled = true;
  $("#pairBtn").textContent = "Pareando...";
  chrome.runtime.sendMessage({ type: "PAIR", appUrl, deviceToken }, (res) => {
    $("#pairBtn").disabled = false;
    $("#pairBtn").textContent = "Parear";
    if (res?.success) {
      $("#result").className = "result ok";
      $("#result").textContent = `Pareado! ${res.itemCount} contas encontradas.`;
      updateStatus({ paired: true, pluggyToken: true });
    } else {
      $("#result").className = "result err";
      $("#result").textContent = res?.error ?? "Erro desconhecido.";
    }
  });
});
