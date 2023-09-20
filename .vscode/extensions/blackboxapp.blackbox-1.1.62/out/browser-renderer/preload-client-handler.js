function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}
window.electron.eventFromMainProcess((evt, response)=>{
    // console.log("===>", evt, response);    
});

window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    let selectedText = getSelectionText();
    window.electron.showContextMenu(selectedText);
  })
  
// ipcRenderer.on('context-menu-command', (e, command) => {
// // What it will do when this options is click it
// })
