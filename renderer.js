const $ = id => document.getElementById(id);
let loggedIn = false;

function setStatus(t) { $("status").textContent = t; }
function afterLogin(name) {
  loggedIn = true;
  $("who").textContent = "Zalogowano jako " + name;
  $("playBtn").disabled = false;
  setStatus("Gotowy do gry.");
}
function msg(e) { return String(e && e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""); }

$("ram").addEventListener("input", () => $("ramVal").textContent = $("ram").value);

$("msBtn").addEventListener("click", async () => {
  try { setStatus("Logowanie…"); afterLogin(await window.nova.loginMs()); }
  catch (e) { setStatus("Błąd logowania: " + msg(e)); }
});
$("offBtn").addEventListener("click", async () => {
  try { afterLogin(await window.nova.loginOffline($("nick").value)); }
  catch (e) { setStatus(msg(e)); }
});

$("playBtn").addEventListener("click", async () => {
  $("playBtn").disabled = true;
  setStatus("Przygotowuję grę…");
  try { await window.nova.play({ version: $("ver").value, ram: $("ram").value }); }
  catch (e) { setStatus("Błąd: " + msg(e)); $("playBtn").disabled = false; }
});

window.nova.onLog(m => {
  if (m.t === "progress" && m.d && m.d.total) {
    $("barIn").style.width = Math.round(m.d.task / m.d.total * 100) + "%";
    setStatus("Pobieranie plików gry…");
  } else if (m.t === "data") {
    setStatus("Gra uruchomiona.");
  } else if (m.t === "close") {
    setStatus("Gra zamknięta (kod " + m.d + ").");
    $("barIn").style.width = "0"; $("playBtn").disabled = !loggedIn;
  }
});

(async () => {
  try {
    const vs = await window.nova.versions();
    $("ver").innerHTML = vs.map(v => `<option>${v}</option>`).join("");
  } catch (e) { $("ver").innerHTML = "<option>1.21.1</option><option>1.8.9</option>"; }
})();
