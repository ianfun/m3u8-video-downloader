const {
    contextBridge,
    ipcRenderer
} = require('electron');

contextBridge.exposeInMainWorld('appInterface', {
    update: () => ipcRenderer.invoke('update'),
    add: url => ipcRenderer.send('add', url),
    add_direct: data => ipcRenderer.send('add-direct', data),
    browse: () => ipcRenderer.invoke('browse'),
    checkPath: path => ipcRenderer.send('check-path', path),
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
    register_remove: callback => {
        ipcRenderer.on('remove-task', callback);
    },
    register_set_title: callback => {
        ipcRenderer.on('set-title', callback);
    },
    register_ok_path: callback => {
        ipcRenderer.on('ok-path', callback);
    },
    oncontextmenu: (url) => ipcRenderer.send('menu-show', url),
    oncontextmenu2: () => ipcRenderer.send('menu-show2'),
    onclick: () => ipcRenderer.send('menu-hide')
});