const createdWins = {};
const tasksList = document.getElementById('tasks');
const path_select = document.getElementById('path_select');
const url_input = document.getElementById('url_input');

function add_task(url, download_url, title) {
    const task_elem = document.createElement('div');
    const task_title_elem = document.createElement('p');
    const task_url_elem = document.createElement('p');
    const task_download_url_elem = document.createElement('p');
    const progress_elem = document.createElement('progress');
    task_elem.oncontextmenu = function(event) {
        event.preventDefault();
        event.stopPropagation();
        appInterface.oncontextmenu(event.currentTarget.childNodes[1].innerText);
    }
    task_elem.classList.add('Task');
    task_title_elem.innerText = title;
    task_title_elem.classList.add('title');
    task_url_elem.innerText = url;
    task_download_url_elem.innerText = download_url;
    task_download_url_elem.classList.add('details');
    task_download_url_elem.style.fontSize = '0.8em';
    task_download_url_elem.style.color = 'gray';
    task_url_elem.classList.add('details');
    task_elem.appendChild(task_title_elem);
    task_elem.appendChild(task_url_elem);
    task_elem.appendChild(task_download_url_elem);
    task_elem.appendChild(progress_elem);
    tasksList.appendChild(task_elem);
    createdWins[url] = task_elem;
}
appInterface.update().then(function(res) {
    for (let i of res) {
        add_task(i.url, i['download-url'], i.title);
    }
});
document.getElementById('go').onclick = function(event) {
    event.preventDefault();
    const in_url = url_input.value;
    if (!path_select.innerText.length) {
        return alert('No output folder selected!');
    }
    if (!in_url.length) {
        return alert('Please enter a URL.');
    }
    try {
        const u = new URL(in_url);
        appInterface.add(u.href);
    } catch (e) {
        alert('The URL ' + in_url + ' is not a valid URL.');
    }
    return false;
}
url_input.oninput = function() {
    url_input.value = url_input.value.replaceAll(' ', '').replaceAll('\t', '');
}

appInterface.register_add_task(function(event, data) {
    add_task(data.url, data['download-url'], data.title);
});
appInterface.register_error(function(event, data) {
    const win = createdWins[data.url];
    if (win) {
        win.childNodes[2].innerText = 'Error: ' + data.reason;
    }
});
appInterface.register_progress(function(event, data) {
    const win = createdWins[data.url];
    if (win) {
        win.childNodes[3].value = data.progress;
    }
});
appInterface.register_complete(function(event, data) {
    const win = createdWins[data.url];
    if (win) {
    }
});

window.oncontextmenu = () => appInterface.oncontextmenu2();
window.onclick = appInterface.onclick;
document.getElementById('browse').onclick = function() {
    appInterface.browse().then(res => {
        path_select.innerText = res;
    })
}
