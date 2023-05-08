const { saveConfig, global_config, tasks_path } = require('./config.js');
const { app, BrowserWindow, ipcMain, shell, session, Menu } = require('electron');
const fs = require('fs');
const path = require('path')
const { dialog } = require('electron')
const { downloadM3U8, triggerState, isPaused } = require('./m3u8.js');

var global_window;
var global_small_menu;
var current_menu = null;
var global_menu;
var menu_url;
var tasks = [];
var selected_path = '';
var id_to_win = {};

function getExtForMineType(mine) {
  const map = {
      'image/png': 'png',
      'image/tiff': 'tif',
      'image/vnd.wap.wbmp': 'wbmp',
      'image/x-icon': 'ico',
      'image/x-jng': 'jng',
      'image/x-ms-bmp': 'bmp',
      'image/svg+xml': 'svg',
      'image/jpeg': 'jpg',
      "image/jpg": "jpg",
      'image/webp': 'webp',
      'video/mp2t': 'ts',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'video/x-msvideo': 'avi'
  }
  const a = map[mine.toLowerCase()];
  return a ? ('.' + a) : '';
}
function load_tasks() {
  try {
    tasks = JSON.parse(fs.readFileSync(tasks_path, { 'encoding': 'utf8'}));
  } catch (e) {}
}
function new_task(old, url, title, path) {
  tasks.push({'url': old, 'download-url': url, 'progress': 0, 'title': title, 'path': path});
  fs.writeFileSync(tasks_path, JSON.stringify(tasks));
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
  global_window = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1200,
    height: 900,
    autoHideMenuBar: true
  });
  global_window.loadFile('./app/index.html');
  global_window.on('closed', () => {
    app.quit();
  });
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
              const _path = url_win[2] + path.sep + title + '.ts';
              new_task(oldurl, url, title, _path);
              global_window.webContents.send('add-task', {
                'url': url_win[0],
                'download-url': url,
                'title': title
              });
              (!url_win[1].isDestroyed) && url_win[1].destroy();
              downloadM3U8(
                oldurl,
                url,
                (progress) => { global_window.webContents.send('add-progress', {'url': oldurl, 'progress': progress}); },  
                (err) => { global_window.webContents.send('add-error', {'url': oldurl, 'reason': err}); }, 
                _path,
                () => { global_window.webContents.send('add-complete', {'url': oldurl}); }
              );
            }
          }
        }
      }
    }
    callback({});
  });
  ipcMain.handle('update', () => {
    for (let i of tasks) {
      const oldurl = i.url;
      downloadM3U8(
        oldurl,
        i['download-url'],
        (progress) => { global_window.webContents.send('add-progress', {'url': oldurl, 'progress': progress}); },  
        (err) => { global_window.webContents.send('add-error', {'url': oldurl, 'reason': err}); }, 
        i.path,
        () => { global_window.webContents.send('add-complete', {'url': oldurl}); }
      );
    }
    return tasks;
  }
  );
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
  ipcMain.handle('browse', (event) => {
    return new Promise((resolve, reject) => {
      dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }).then(res => {
        if (!res.canceled) {
          resolve(selected_path = res.filePaths[0]);          
        }
      }).catch(e => reject(e));
    });
  });
  const settings_menu = 
  {
    'label': 'settings',
    'submenu': [
      {
        'label': 'Fetch method',
        'submenu': [
          {
            'label': 'Use Node.js builtin fetch',
            'click': function() {
              global_config.fetch_method = 2;
              saveConfig();
            }
          },
          {
            'label': 'Node.JS http+https module(node:http, node:https)',
            'click': function() {
              global_config.fetch_method = 1;
              saveConfig();
            }
          },
          {
            'label': 'Use Chromium\'s native networking library(electron.net)',
            'click': function() {
              global_config.fetch_method = 0;
              saveConfig();
            }
          },
          { 'type': 'separator' },
          { 
            'label': 'Set \'NODE_TLS_REJECT_UNAUTHORIZED\' to \'0\'(Restart required)', 
            'type': 'checkbox', 
            'checked': !global_config.NODE_TLS_REJECT_UNAUTHORIZED,
            'click': function() {
              global_config.NODE_TLS_REJECT_UNAUTHORIZED = !global_config.NODE_TLS_REJECT_UNAUTHORIZED;
              saveConfig();
            }
          }
        ]
      }
    ]
  }
  global_small_menu = Menu.buildFromTemplate([settings_menu]);
  var templete = [
    {
      label: 'Open Containing Folder',
      click: () => { 
        for (let x of tasks) {
          if (x.url == menu_url) {
            shell.showItemInFolder(x.path);
          }
        }
      }
    },
    {
      label: 'Open Output File',
      click: () => {
        for (let x of tasks) {
          if (x.url == menu_url) {
            shell.openPath(x.path);
          }
        }
      }
    },
    {
      label: 'Remove Task',
      click: () => {
        global_window.webContents.send('remove-task', menu_url);
        if (!isPaused(menu_url)) {
          triggerState(menu_url);
          for (let i = 0;i < tasks.length;++i) {
            if (tasks[i].url == menu_url) {
              tasks.splice(i, 1);
            }
          }
        }
      }
    },
    {
      label: 'Pause/Resume Download',
      click: () => {
        triggerState(menu_url);
      }
    }
  ]
  templete.push(settings_menu);
  global_menu = Menu.buildFromTemplate(templete)
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
load_tasks();
