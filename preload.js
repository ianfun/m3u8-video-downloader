const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appInterface', {
  update: () => ipcRenderer.invoke('update'),
  add: (url) => ipcRenderer.send('add', url),
  browse: () => ipcRenderer.invoke('browse'),
  register_add_task: callback => {
    ipcRenderer.on('add-task', callback);
  },
  register_error: callback => {
    ipcRenderer.on('add-error', callback);
  },
  register_progress: callback => {
    ipcRenderer.on('add-progress', callback);
  },
  register_complete: callback => {
    ipcRenderer.on('add-complete', callback);
  },
  oncontextmenu: (url) => ipcRenderer.send('menu-show', url),
  oncontextmenu2: () => ipcRenderer.send('menu-show2'),
  onclick: () => ipcRenderer.send('menu-hide')
});
