const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("nova", {
  versions: () => ipcRenderer.invoke("versions"),
  loginMs: () => ipcRenderer.invoke("login-microsoft"),
  loginOffline: n => ipcRenderer.invoke("login-offline", n),
  play: o => ipcRenderer.invoke("play", o),
  onLog: cb => ipcRenderer.on("log", (e, m) => cb(m))
});
