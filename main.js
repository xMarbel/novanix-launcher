const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { Client, Authenticator } = require("minecraft-launcher-core");
const { Auth } = require("msmc");

let win;
let account = null; // { auth, name }
const root = path.join(app.getPath("appData"), ".novanix");

function createWindow() {
  win = new BrowserWindow({
    width: 960, height: 620, minWidth: 820, minHeight: 560,
    backgroundColor: "#070520", autoHideMenuBar: true, title: "Novanix",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true }
  });
  win.loadFile("index.html");
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

// Lista wersji (tylko stabilne) prosto od Mojang
ipcMain.handle("versions", async () => {
  const r = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json");
  const j = await r.json();
  return j.versions.filter(v => v.type === "release").map(v => v.id);
});

// Logowanie kontem Microsoft (legalne konto z Minecraftem)
ipcMain.handle("login-microsoft", async () => {
  const auth = new Auth("select_account");
  const xbox = await auth.launch("electron");
  const mc = await xbox.getMinecraft();
  account = { auth: mc.mclc(), name: mc.profile.name };
  return account.name;
});

// Tryb offline - tylko do testów (serwery premium nie wpuszczą)
ipcMain.handle("login-offline", (e, name) => {
  name = (name || "").trim();
  if (!/^\w{3,16}$/.test(name)) throw new Error("Nick: 3-16 znaków (litery, cyfry, _)");
  account = { auth: Authenticator.getAuth(name), name };
  return name;
});

ipcMain.handle("play", async (e, { version, ram }) => {
  if (!account) throw new Error("Najpierw się zaloguj");
  const launcher = new Client();
  const send = (t, d) => win && win.webContents.send("log", { t, d });
  launcher.on("debug", m => send("debug", String(m)));
  launcher.on("data", m => send("data", String(m)));
  launcher.on("progress", p => send("progress", p));
  launcher.on("close", c => send("close", c));
  const proc = await launcher.launch({
    authorization: account.auth,
    root,
    version: { number: version, type: "release" },
    memory: { max: ram + "G", min: "1G" }
  });
  if (!proc) throw new Error("Nie udało się uruchomić gry (sprawdź, czy masz zainstalowaną Javę)");
});
