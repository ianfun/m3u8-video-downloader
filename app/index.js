const createdWins = {};
const browse_btn = document.getElementById('browse');
const tasksList = document.getElementById('tasks');
const path_select = document.getElementById('path_select');
const url_input = document.getElementById('url_input');
const message_bar = document.getElementById('message_bar');
const btn_go = document.getElementById('go');
var message_count = 0;
var message_slash = '/';
var message_text = '';
var cur_timeout = null;
var yt_job;
var yt_opt;
var yt_select = $('#yt-select');
var yt_json;

document.title = gettext('docuemnt-title');
document.getElementById('header').innerText = gettext('docuemnt-header');
btn_go.innerText = gettext('download');
document.getElementById('choose-folder').innerText = gettext('download-folder');
yt_select[0].setAttribute('title', gettext('choose-output'));
browse_btn.innerText = gettext('browse-path');
url_input.placeholder = gettext('url-placeholder');

function status_static(text) {
    if (cur_timeout != null) {
        clearTimeout(cur_timeout);
        cur_timeout = null;
    }
    message_bar.innerText = text;
}

function status_message(text) {
    if (cur_timeout != null) {
        clearTimeout(cur_timeout);
        cur_timeout = null;
    }
    message_text = text;
    message_count = 0;

    function nextT() {
        switch (message_slash) {
            case '/':
                message_slash = '-';
                break;
            case '|':
                message_slash = '/';
                break;
            case '\\':
                message_slash = '|';
                break;
            case '-':
                message_slash = '\\';
                break;
        }
        message_bar.innerText = message_text + ' ' + message_slash;
        if (++message_count < 40)
            cur_timeout = setTimeout(nextT, 400);
    }
    nextT();
}

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
    const default_path = localStorage.getItem('default_path');
    if (default_path) {
        appInterface.checkPath(default_path);
    }
    for (let i of res)
        add_task(i.url, i['download-url'], i.title);
});

function spawnYT(url) {
    status_static(gettext('start-download'));
    var o = yt_opt.selectedOptions[0];
    var label = o.parentElement.label;
    const oldurl = 'https://www.youtube.com/watch?v=' + yt_json.vid;
    appInterface.add_direct({
        'oldurl': oldurl,
        'url': url,
        'format': label,
        'title': yt_json.title
    });
    add_task(oldurl, url, yt_json.title);
}
function renderYTLinks(x, p) {
    for (let o of Object.values(x)) {
        var n = document.createElement('option');
        n.innerText = o.q + ' (' + o.size + ')';
        p.appendChild(n);
        n.q = o.q;
        n.k = o.k;
    }
}
function downloadYoutube(u) {
    const data = new URLSearchParams();
    data.append('q', u.href);
    data.append('vt', 'home');
    fetch(
            'https://x2download.app/api/ajaxSearch', {
                'method': 'POST',
                'body': data,
                'headers': {
                    'x-requested-with': 'XMLHttpRequest'
                }
            }
        )
        .then(res => res.json())
        .then(json => {
            yt_json = json;
            if (json.status != 'ok' || json.mess)
                return status_static(json.mess || gettext(this.url));
            var select = document.createElement('select');
            select.id = 'select-bar';
            var mp3 = document.createElement('optgroup');
            var mp4 = document.createElement('optgroup');
            var _3gp = document.createElement('optgroup');
            var ogg = document.createElement('optgroup');
            mp4.label = 'mp4';
            mp3.label = 'mp3';
            _3gp.label = '3gp';
            ogg.label = 'ogg';
            select.appendChild(mp3);
            select.appendChild(mp4);
            select.appendChild(ogg);
            select.appendChild(_3gp);
            var links = json.links;
            renderYTLinks(links.mp3, mp3);
            renderYTLinks(links.mp4, mp4);
            renderYTLinks(links.ogg, ogg);
            renderYTLinks(links['3gp'], _3gp);
            yt_select[0].insertBefore(select, yt_select[0].firstChild);
            var span = document.createElement('p');
            span.innerText = json.title;
            yt_select[0].insertBefore(span, select);
            var img = document.createElement('img');
            img.src = 'https://i.ytimg.com/vi/' + json.vid + '/mqdefault.jpg';
            img.style.borderRadius = '10px';
            img.style.display = 'block';
            img.style.margin = '0px auto';
            yt_select[0].insertBefore(img, select);
            yt_opt = select;
            status_message(gettext('waiting-input'));
            yt_select.dialog('open');
            yt_job = function() {
                var o = yt_opt.selectedOptions[0];
                let data = new URLSearchParams();
                var label = o.parentElement.label;
                data.append('v_id', yt_json.vid);
                data.append('ftype', label);
                data.append('fquality', o.k);
                data.append('token', yt_json.token);
                data.append('timeExpire', yt_json.timeExpires);
                data.append('client', '');
                status_message(gettext('converting'));
                fetch(
                        'https://backend.svcenter.xyz/api/convert-by-45fc4be8916916ba3b8d61dd6e0d6994', {
                            'method': 'POST',
                            'body': data,
                            'headers': {
                                "X-Requested-Key": "de0cfuirtgf67a",
                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                "X-Requested-With": "XMLHttpRequest"
                            }
                        }
                    )
                    .then(res => res.json())
                    .then(json => {
                        if (json.c_status != 'ok')
                            return status_static(gettext('server-error'));
                        if (json.d_url)
                            return spawnYT(json.d_url);
                        var xhr = new XMLHttpRequest();
                        let c_server = json.c_server;
                        xhr.open('POST', c_server + "/api/json/convert");
                        xhr.onerror = err => status_static(err);
                        xhr.responseType = 'json';
                        xhr.onload = event => {
                            const xhr = event.target;
                            const json = xhr.response;
                            switch (json.statusCode) {
                                case 200:
                                    return spawnYT(json.result);
                                case 300: {
                                    var job = json.jobId;
                                    var u = new URL(c_server);
                                    var ws = new WebSocket((u.protocol == "https:" ? "wss:" : "ws:") + '//' + u.host + '/sub/' + job);
                                    ws.onmessage = msg => {
                                        const json = JSON.parse(msg.data);
                                        if (json.action == 'success')
                                            return spawnYT(json.url);
                                        else if (json.action == 'progress') {
                                            status_static(gettext('converting-progress', json.value));
                                        } else
                                            status_static(gettext('server-error'));
                                    }
                                    ws.onerror = () => status_static(gettext('server-error'));
                                    break;
                                }
                                default:
                                    status_static(gettext('server-error'));
                            }
                        };
                        {
                            var o = yt_opt.selectedOptions[0];
                            let data = new URLSearchParams();
                            var label = o.parentElement.label;
                            data.append('v_id', yt_json.vid);
                            data.append('ftype', label);
                            data.append('fquality', o.k);
                            data.append('token', yt_json.token);
                            data.append('timeExpire', yt_json.timeExpires);
                            data.append('client', '');
                            data.append('fname', yt_json.title);
                            xhr.send(data);
                        }
                    })
            };
        });
}
btn_go.onclick = function(event) {
    event.preventDefault();
    const in_url = url_input.value;
    if (!path_select.innerText.length)
        return alert(gettext('folder-required'));
    if (!in_url.length)
        return alert(gettext('url-required'));
    var u;
    try {
        u = new URL(in_url);
    } catch (e) {
        alert(gettext('invalid-url', in_url));
        return;
    }
    if (u.hostname == 'youtu.be' || u.hostname == 'www.youtube.com') {
        status_message(gettext('converting'));
        downloadYoutube(u);
    } else {
        status_message(gettext('importing'));
        appInterface.add(u.href);
    }
    return false;
}
url_input.oninput = function() {
    url_input.value = url_input.value.replaceAll(' ', '').replaceAll('\t', '');
}
appInterface.register_add_task(function(event, data) {
    status_message(null);
    add_task(data.url, data['download-url'], data.title);
});
appInterface.register_error(function(event, data) {
    status_static(data.reason);
    const win = createdWins[data.url];
    if (win) {
        win.childNodes[2].innerText = data.reason;
    }
});
appInterface.register_progress(function(event, data) {
    const win = createdWins[data.url];
    if (win) {
        win.childNodes[3].value = data.progress;
    }
});
appInterface.register_complete(function(event, data) {
    status_message.innerText = gettext('complete-download', data.url);
    const win = createdWins[data.url];
    if (win) {
        win.childNodes[2].innerText = gettext('completed');
    }
});
appInterface.register_remove(function(event, data) {
    const win = createdWins[data];
    if (win) {
        delete createdWins[data];
        win.parentElement.removeChild(win);
    }
});
appInterface.register_set_title(function(event, data) {
    const win = createdWins[data.url];
    if (win) {
        win.childNodes[0].innerText = data.title;
    }
});
appInterface.register_ok_path(function(event, path) {
    path_select.innerText = path;
});
window.oncontextmenu = () => appInterface.oncontextmenu2();
window.onclick = appInterface.onclick;
browse_btn.onclick = function() {
    appInterface.browse().then(res => {
        path_select.innerText = res;
        localStorage.setItem('default_path', res);
    })
}
yt_select.dialog({
    'autoOpen': false,
    'minWidth': 550,
    'buttons': [{
        'text': gettext('download'),
        'click': () => {
            yt_select.empty();
            yt_select.dialog('close');
            yt_job();
        }
    }]
});
onload = function() {
    function show_online() {
        const onlineObj = document.getElementById('online');
        const offlineObj = document.getElementById('offline');
        onlineObj.style.display = 'block';
        offlineObj.style.display = 'none';
    }

    function show_offline() {
        const offlineText = document.getElementById('offline_text');
        const onlineObj = document.getElementById('online');
        const offlineObj = document.getElementById('offline');
        onlineObj.style.display = 'none';
        offlineText.innerText = gettext('offline');
        offlineObj.style.display = 'block';
    }
    window.addEventListener("offline", show_offline);
    window.addEventListener("online", show_online);
    (!navigator.onLine) && show_offline();
}