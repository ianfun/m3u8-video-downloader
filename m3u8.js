const { net } = require('electron');
const { global_config } = require('./config.js');
const { Parser } = require('m3u8-parser');
const fs = require('node:fs/promises');
const http = require('http');
const https = require('https');

var downloaders = {};
var fetch_errors = 0;

function resolve(base, url) {
  return new URL(url, base).href;
}
function mfetch(url) {
  switch (global_config.fetch_method) {
    case 0:
    case 1:
      return new Promise((resolve, reject) => {
        var n = net;
        if (global_config.fetch_method == 1) {
          try {
            var u = new URL(url);
            if (u.protocol == 'https')
              n = https;
            else if (u.protocol == 'http')
              n = http;
            else
              reject('Protocol ' + u.protocol + ' is not http or https');
          } catch (e) { reject(e); return; }
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
            reject(`HTTP ${res.statusCode} ${res.statusMessage}`);
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
class M3U8Downloader {
  constructor(oldurl, onprogress, onerror, oncomplete, path) {
    this.paused = false;
    this.onprogress = onprogress;
    this.onerror = onerror;
    this.path = path;
    this.oncomplete = oncomplete;
    downloaders[oldurl] = this;
    this.realURL = null;
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
      this.onerror("No segments or playlists found in m3u8!(" + url + ')');
    });
  }
  async downloadSegments(base, segments) {
    this.realURL = base;
    this.segments = segments;
    var data;
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
  'downloadM3U8': function (oldurl, url, onprogress, onerror, path, oncomplete) {
    new M3U8Downloader(oldurl, onprogress, onerror, oncomplete, path).downloadM3U8(url);
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
