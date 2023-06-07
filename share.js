const fs = require('fs');
const path = require('path');
const {
    app
} = require('electron');
const home_dir = app.getPath('home');
const config_path = path.resolve(home_dir, '.m3u8downloader_config');
const tasks_path = path.resolve(home_dir, '.m3u8downloader_tasks');
var global_config;
var global_window;
var tasks;
var all_tasks;
const encoding = {
    'encoding': 'utf8'
};

try {
    tasks = JSON.parse(fs.readFileSync(tasks_path, {
        'encoding': 'utf8'
    }));
    all_tasks = [...tasks];
} catch (e) {
    tasks = [];
    all_tasks = [];
}
try {
    global_config = JSON.parse(fs.readFileSync(config_path, encoding));
} catch (e) {
    global_config = {
        'NODE_TLS_REJECT_UNAUTHORIZED': true,
        'fetch_method': 2
    };
}
loaded = true;
if (!global_config.NODE_TLS_REJECT_UNAUTHORIZED)
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

function save() {
    fs.writeFileSync(tasks_path, JSON.stringify(tasks), encoding);
}
exports.save = save;
exports.tasks = tasks;
exports.global_window = global_window;
exports.remove_url = url => {
    for (let i = 0; i < tasks.length; ++i) {
        if (tasks[i].url == url) {
            tasks.splice(i, 1);
            break;
        }
    }
    save();
};
exports.global_config = global_config;
exports.saveConfig = () => {
    fs.writeFileSync(config_path, JSON.stringify(global_config), encoding);
};
exports.all_tasks = all_tasks;
exports.new_task = (old, url, title, path, type) => {
    const x = {
        'url': old,
        'download-url': url,
        'progress': 0,
        'title': title,
        'path': path,
        "type": type
    };
    all_tasks.push(x);
    tasks.push(x);
    save();
}