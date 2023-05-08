var global_config;
var loaded = false;
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const home_dir = app.getPath('home');
const config_path = path.resolve(home_dir, '.m3u8downloader_config');
const tasks_path = path.resolve(home_dir, '.m3u8downloader_tasks');
function saveConfig() {
  fs.writeFileSync(config_path, JSON.stringify(global_config), { 'encoding': 'utf8' } );
}

if (!loaded) {
    try {
      global_config = JSON.parse(fs.readFileSync(config_path, {'encoding': 'utf8'}));
    } catch (e) {
      global_config = {
        'NODE_TLS_REJECT_UNAUTHORIZED': true,
        'fetch_method': 0
      };
    }
    loaded = true;
    if (!global_config.NODE_TLS_REJECT_UNAUTHORIZED)
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

module.exports = { 'global_config': global_config , 'saveConfig': saveConfig, 'tasks_path': tasks_path };
