const gettext = require('./gettext.js');
const {
    net
} = require('electron');
const {
    Parser
} = require('m3u8-parser');
const fs = require('node:fs/promises');
const http = require('http');
const https = require('https');
const path = require('path');
const os = require('os');
const share = require('./share.js');

var downloaders = {};
var fetch_errors = 0;
// http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247%28v=vs.85%29.aspx
const bad_set = new Set((os.platform() == 'win32') ? [
    '/',
    '\\',
    '?',
    '*',
    ':',
    '|',
    '"',
    '<',
    '>',
    '\0'
] : [
    '/'
]);

function sanitize(filename) {
    for (let i = 0; i < filename.length; ++i) {
        if (bad_set.has(filename[i])) {
            filename = filename.replaceAll(filename[i], '-');
        }
    }
    return filename;
}

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

function resolve(base, url) {
    return new URL(url, base).href;
}

function mfetch(url) {
    switch (share.global_config.fetch_method) {
        case 0:
        case 1:
            return new Promise((resolve, reject) => {
                var n = net;
                if (share.global_config.fetch_method == 1) {
                    try {
                        var u = new URL(url);
                        if (u.protocol == 'https')
                            n = https;
                        else
                            n = http;
                    } catch (e) {
                        reject(e);
                        return;
                    }
                }
                const req = n.request(url);
                req.on('response', (res) => {
                    if (res.statusCode >= 200 && res.statusCode <= 299)
                        resolve({
                            'text': function() {
                                return new Promise((resolve, reject) => {
                                    let chunks = [];
                                    res.on('error', reject);
                                    res.on('aborted', reject);
                                    res.on('data', (buffer) => {
                                        chunks.push(buffer);
                                    });
                                    res.on('end', function() {
                                        resolve(Buffer.concat(chunks).toString('utf8'));
                                    });
                                })
                            },
                            'json': function() {
                                return new Promise((resolve, reject) => {
                                    let chunks = [];
                                    res.on('error', reject);
                                    res.on('aborted', reject);
                                    res.on('data', (buffer) => {
                                        chunks.push(buffer);
                                    });
                                    res.on('end', function() {
                                        try {
                                            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })
                            },
                            'arrayBuffer': function() {
                                return new Promise((resolve, reject) => {
                                    let chunks = [];
                                    res.on('error', reject);
                                    res.on('aborted', reject);
                                    res.on('data', (buffer) => {
                                        chunks.push(buffer);
                                    });
                                    res.on('end', function() {
                                        resolve(Buffer.concat(chunks).buffer);
                                    });
                                })
                            }
                        });
                    else
                        reject(gettext('server-code', res.statusCode, res.statusMessage));
                })
                req.on('error', reject);
                req.on('abort', reject);
                req.end();
            });
        case 2:
            return fetch(url);
    }
}

function super_fetch_text(url) {
    return new Promise((resolve, reject) => {
        mfetch(url)
            .then(res => res.text())
            .then(resolve)
            .catch(err => {
                if (++fetch_errors > 10)
                    return reject(err);
                setTimeout(() => super_fetch_text(url), 30000);
            });
    });
}

function better_fetch_text(url) {
    fetch_errors = 0;
    return super_fetch_text(url);
}

function super_fetch_buffer(url) {
    return new Promise((resolve, reject) => {
        mfetch(url)
            .then(res => res.arrayBuffer())
            .then(resolve)
            .catch(err => {
                if (++fetch_errors > 10)
                    return reject(err);
                setTimeout(() => super_fetch_buffer(url), 30000);
            });
    });
}

function better_fetch_buffer(url) {
    fetch_errors = 0;
    return super_fetch_buffer(url);
}
class FileDownloader {
    constructor(make_path, url, format, title, oldurl, onprogress, onerror, oncomplete, path) {
        this.make_path = make_path;
        this.url = url;
        this.title = title;
        this.paused = false;
        this.onprogress = onprogress;
        this.onerror = onerror;
        this.oncomplete = oncomplete;
        this.realURL = null;
        this.oldurl = oldurl;
        this.path = path;
        this.format = format;
    }
    triggerState() {
        if (this.paused) {
            this.paused = false;
            this.start();
        } else {
            this.paused = true;
        }
    }
    async start() {
        const url = this.url;
        if (this.make_path) {
            this.path = this.path + path.sep + this.title + '.' + this.format;
            share.new_task(this.oldurl, url, this.title, this.path, 'youtube');
        }
        if (share.global_config.fetch_method == 2) {
            fetch(url).then(async res => {
                const total = parseInt(res.headers['content-length'] || res.headers['Content-Length']);
                var readed = 0;
                var fallback = 0.05;
                const fd = await fs.open(this.path, 'w');
                this.onprogress(fallback);
                const r = res.body.getReader();
                var chunk;
                while (chunk = await r.read(), chunk.value != undefined) {
                    readed += chunk.value.length;
                    await fd.write(chunk.value);
                    if (!Number.isNaN(total)) {
                        this.onprogress(readed / total);
                    } else {
                        this.onprogress(fallback += 0.005);
                        if (fallback >= 0.995) {
                            fallback = 0.0;
                        }
                    }
                }
                await fd.close();
                this.oncomplete();
            }).catch(this.onerror);
            return;
        }
        const fd = await fs.open(this.path, 'w');
        var n = net;
        if (share.global_config.fetch_method == 1) {
            var u = new URL(url);
            if (u.protocol == 'https')
                n = https;
            else
                n = http;
        }
        const req = n.request(url);
        req.on('response', res => {
            var readed = 0;
            var fallback = 0.05;
            const total = parseInt(res.headers['content-length'] || res.headers['Content-Length']);
            if (res.statusCode >= 200 && res.statusCode <= 299) {
                res.on('data', function(data) {
                    if (!Number.isNaN(total)) {
                        readed += buffer.length;
                        this.onprogress(readed / total);
                    } else {
                        this.onprogress(fallback += 0.005);
                        if (fallback >= 0.995) {
                            fallback = 0.0;
                        }
                    }
                });
                res.on('end', function() {
                    fd.close();
                    this.oncomplete();
                });
            } else
                this.onerror(gettext('server-code', res.statusCode, res.statusMessage));
        })
        req.on('error', this.onerror);
        req.on('abort', this.onerror);
        req.end();
    }
}
class M3U8Downloader {
    constructor(make_path, title, oldurl, onprogress, onerror, oncomplete, path) {
        this.make_path = make_path;
        this.title = title;
        this.paused = false;
        this.onprogress = onprogress;
        this.onerror = onerror;
        this.oncomplete = oncomplete;
        this.realURL = null;
        this.oldurl = oldurl;
        this.path = path;
    }
    triggerState() {
        if (this.paused) {
            this.paused = false;
            this.downloadSegments(this.realURL, this.segments);
        } else {
            this.paused = true;
        }
    }
    downloadM3U8(url) {
        better_fetch_text(url).then(txt => {
            var p = new Parser();
            p.push(txt);
            p.end();
            if (p.manifest.playlists && p.manifest.playlists.length)
                return this.downloadM3U8(resolve(url, p.manifest.playlists[0].uri));
            if (p.manifest.segments.length)
                return this.downloadSegments(url, p.manifest.segments);
            this.onerror(gettext('m3u8-no-segments', url));
        });
    }
    async downloadSegments(base, segments) {
        this.realURL = base;
        this.segments = segments;
        var data;
        if (this.make_path) {
            this.path = this.path + path.sep + this.title + '.ts';
            share.new_task(this.oldurl, this.realURL, this.title, this.path, 'm3u8');
        }
        const fd = await fs.open(this.path, 'w');
        var c = 0;
        for (let i of segments) {
            try {
                if (this.paused) return;
                data = new Uint8Array(await better_fetch_buffer(resolve(base, i.uri)));
                await fd.write(data);
                if (this.paused) return;
            } catch (e) {
                this.onerror(e.toString());
                return;
            }
            this.onprogress(++c / segments.length);
        }
        await fd.close();
        this.oncomplete();
    }
}

module.exports = {
    'download_direct': function(make_path, format, title, oldurl, url, onprogress, onerror, path, oncomplete) {
        console.log('download_direct ', make_path);
        (downloaders[oldurl] = new FileDownloader(make_path, url, format, sanitize(title), oldurl, onprogress, onerror, oncomplete, path)).start();
    },
    'download': function(make_path, title, oldurl, url, onprogress, onerror, path, oncomplete) {
        console.log('download ', make_path);
        (downloaders[oldurl] = new M3U8Downloader(make_path, sanitize(title), oldurl, onprogress, onerror, oncomplete, path)).downloadM3U8(url);
    },
    'triggerState': function(url) {
        const ref = downloaders[url];
        ref && ref.triggerState();
    },
    'isPaused': function(url) {
        const ref = downloaders[url];
        if (ref) {
            return ref.paused;
        }
        return true;
    }
}