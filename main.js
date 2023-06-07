const {
    app,
    BrowserWindow,
    ipcMain,
    shell,
    session,
    Menu,
    dialog
} = require('electron');
const gettext = require('./gettext.js');
const fs = require('fs');
const path = require('path')
const {
    download_direct,
    download,
    triggerState,
    isPaused
} = require('./download.js');
const share = require('./share.js');

var global_small_menu;
var current_menu = null;
var global_menu;
var menu_url;

var selected_path = '';
var id_to_win = {};

function remove_url(url) {
    for (let i = 0; i < share.tasks.length; ++i) {
        if (share.tasks[i].url == url) {
            share.tasks.splice(i, 1);
            break;
        }
    }
}

function matchMines(mines) {
    for (let i of mines) {
        switch (i) {
            case 'application/x-mpegurl':
            case 'application/vnd.apple.mpegurl':
                return i;
        }
    }
    return null;
}
app.whenReady().then(() => {
    share.global_window = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        width: 1200,
        height: 900,
        autoHideMenuBar: true
    });
    share.global_window.loadFile('./app/index.html');
    share.global_window.on('closed', () => {
        app.quit();
    });
    share.global_window.openDevTools();
    session.defaultSession.webRequest.onHeadersReceived({
        urls: ['*://*/*']
    }, (details, callback) => {
        if (details.responseHeaders && details.webContentsId) {
            for (let h of Object.keys(details.responseHeaders)) {
                if (h.toLowerCase() == 'content-type') {
                    const m = matchMines(details.responseHeaders[h]);
                    if (m) {
                        const url_win = id_to_win[details.webContentsId];
                        if (url_win) {
                            delete id_to_win[details.webContentsId];
                            const url = details.url;
                            var title = details.webContents.getTitle();
                            const oldurl = url_win[0];
                            const idx = title.indexOf('-');
                            if (idx != -1)
                                title = title.slice(0, idx);
                            while (title.length) {
                                if (title[title.length - 1] == ' ')
                                    title = title.slice(0, title.length - 1);
                                else
                                    break;
                            }
                            if (!title.length)
                                title = 'Untitled';
                            const _path = url_win[2];
                            share.global_window.webContents.send('add-task', {
                                'url': url_win[0],
                                'download-url': url,
                                'title': title
                            });
                            (!url_win[1].isDestroyed) && url_win[1].destroy();
                            download(
                                true,
                                title,
                                oldurl,
                                url,
                                (progress) => {
                                    share.global_window.webContents.send('add-progress', {
                                        'url': oldurl,
                                        'progress': progress
                                    });
                                },
                                (err) => {
                                    share.global_window.webContents.send('add-error', {
                                        'url': oldurl,
                                        'reason': err
                                    });
                                },
                                _path,
                                () => {
                                    remove_url(oldurl);
                                    share.global_window.webContents.send('add-complete', {
                                        'url': oldurl
                                    });
                                }
                            );
                        }
                    }
                }
            }
        }
        callback({});
    });
    ipcMain.handle('update', () => {
        for (let i of share.tasks) {
            const oldurl = i.url;
            if (i.type == 'youtube') {
                download_direct(
                    false,
                    '', i.title, oldurl, i['download-url'],
                    progress => {
                        share.global_window.webContents.send('add-progress', {
                            'url': oldurl,
                            'progress': progress
                        });
                    }, // onprogress
                    err => {
                        share.global_window.webContents.send('add-error', {
                            'url': oldurl,
                            'reason': err
                        });
                    },
                    i.path,
                    () => {
                        remove_url(url);
                        share.global_window.webContents.send('add-complete', {
                            'url': oldurl
                        });
                    },
                );
            }
            download(
                false,
                i.title,
                oldurl,
                i['download-url'],
                progress => {
                    share.global_window.webContents.send('add-progress', {
                        'url': oldurl,
                        'progress': progress
                    });
                },
                err => {
                    share.global_window.webContents.send('add-error', {
                        'url': oldurl,
                        'reason': err
                    });
                },
                i.path,
                () => {
                    remove_url(url);
                    share.global_window.webContents.send('add-complete', {
                        'url': oldurl
                    });
                }
            );
        }
        return share.tasks;
    });
    ipcMain.on('add-direct', (event, data) => {
        const {
            oldurl,
            url,
            format,
            title
        } = data;
        download_direct(
            true, format, title, oldurl, url,
            (progress) => {
                share.global_window.webContents.send('add-progress', {
                    'url': oldurl,
                    'progress': progress
                });
            }, // onprogress
            (err) => {
                share.global_window.webContents.send('add-error', {
                    'url': oldurl,
                    'reason': err
                });
            },
            selected_path,
            () => {
                remove_url(url);
                share.global_window.webContents.send('add-complete', {
                    'url': oldurl
                });
            },
        );
    });
    ipcMain.on('add', (event, url) => {
        const ch_win = new BrowserWindow({
            show: false
        });
        ch_win.loadURL(url);
        id_to_win[ch_win.webContents.id] = [url, ch_win, selected_path];
        const f = function() {
            if (id_to_win[ch_win.webContents.id]) {
                delete id_to_win[ch_win.webContents.id];
                (!ch_win.isDestroyed) && ch_win.destroy();
            }
        }
        ch_win.webContents.on('did-finish-load', function() {
            setTimeout(f, 120000);
        });
        ch_win.webContents.on('did-fail-load', f);
    });
    ipcMain.handle('browse', () => {
        return new Promise((resolve, reject) => {
            dialog.showOpenDialog({
                properties: ['openDirectory', 'createDirectory']
            }).then(res => {
                if (!res.canceled) {
                    resolve(selected_path = res.filePaths[0]);
                }
            }).catch(e => reject(e));
        });
    });
    const settings_menu = {
        'label': gettext('menu-setting'),
        'submenu': [{
            'label': 'Fetch method',
            'submenu': [{
                    'label': 'Use Node.js builtin fetch',
                    'click': function() {
                        share.global_config.fetch_method = 2;
                        share.saveConfig();
                    }
                },
                {
                    'label': 'Node.JS http+https module(node:http, node:https)',
                    'click': function() {
                        share.global_config.fetch_method = 1;
                        share.saveConfig();
                    }
                },
                {
                    'label': 'Use Chromium\'s native networking library(electron.net)',
                    'click': function() {
                        share.global_config.fetch_method = 0;
                        share.saveConfig();
                    }
                },
                {
                    'type': 'separator'
                },
                {
                    'label': 'Set \'NODE_TLS_REJECT_UNAUTHORIZED\' to \'0\'(Restart required)',
                    'type': 'checkbox',
                    'checked': !share.global_config.NODE_TLS_REJECT_UNAUTHORIZED,
                    'click': function() {
                        share.global_config.NODE_TLS_REJECT_UNAUTHORIZED = !share.global_config.NODE_TLS_REJECT_UNAUTHORIZED;
                        share.saveConfig();
                    }
                }
            ]
        }]
    }
    global_small_menu = Menu.buildFromTemplate([settings_menu]);
    var templete = [{
            label: gettext('menu-show'),
            click: () => {
                for (let x of share.tasks) {
                    if (x.url == menu_url) {
                        shell.showItemInFolder(x.path);
                    }
                }
            }
        },
        {
            label: gettext('menu-open'),
            click: () => {
                for (let x of share.tasks) {
                    if (x.url == menu_url) {
                        shell.openPath(x.path);
                    }
                }
            }
        },
        {
            label: gettext('menu-remove'),
            click: () => {
                share.global_window.webContents.send('remove-task', menu_url);
                if (!isPaused(menu_url))
                    triggerState(menu_url);
                remove_url(menu_url);
                share.save();
            }
        },
        {
            label: gettext('menu-resume'),
            click: () => {
                triggerState(menu_url);
            }
        }
    ]
    templete.push(settings_menu);
    global_menu = Menu.buildFromTemplate(templete);
    ipcMain.on('check-path', (event, path) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            if (!err)
              share.global_window.webContents.send('ok-path', path);
        });
    });
    ipcMain.on('menu-show2', () => {
        Menu.setApplicationMenu(global_small_menu);
        current_menu = global_small_menu;
        global_small_menu.popup();
    });
    ipcMain.on('menu-show', (event, url) => {
        menu_url = url;
        Menu.setApplicationMenu(global_menu);
        current_menu = global_menu;
        global_menu.popup();
    });
    ipcMain.on('menu-hide', function() {
        current_menu && current_menu.closePopup();
    });
});
