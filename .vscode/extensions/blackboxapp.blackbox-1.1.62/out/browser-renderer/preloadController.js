const { contextBridge, ipcRenderer } = require('electron')


const showContextMenu = (selectedText) => {
    ipcRenderer.send("show-context-menu", selectedText)
}

const eventFromMainProcess = (callback) => ipcRenderer.on("eventFromMainProcess", (callback)) 
const changedPageListener = (callback) => ipcRenderer.on("browser-view-navigated", (callback)) 

let readCookie = async(name) => {
    return window.localStorage[name];
}

let eraseCookie = (name) => {
    createCookie(name, "", -1);
}

let ipcRendererSend = (...args) => ipcRenderer.send(...args);

contextBridge.exposeInMainWorld( 'electron', {
    eventFromMainProcess,
    showContextMenu,
    readCookie,
    eraseCookie,
    ipcRendererSend,
    changedPageListener,
});
