const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();

const translates = {
    "en-us": {
        "menu-setting": "setting",
        "menu-open": "Open video",
        "menu-show": "Show in folder",
        "menu-remove": "Remove",
        "menu-resume": "Pause/Resume download",
        "m3u8-no-segments": "No videos found in the m3u8 file ({1})",
        "server-code": "The server responce with HTTP {1} {2}"
    },
    "zh-tw": {
        "menu-setting": "設定",
        "menu-open": "Open video",
        "menu-show": "在資料夾顯示",
        "menu-remove": "移除下載項目",
        "menu-resume": "暫停/繼續 下載",
        "m3u8-no-segments": "在m3u8檔({1})裡找不到影片",
        "server-code": "伺服器回應 HTTP {1} {2}"
    },
    "zh-cn": {
        "menu-setting": "设定",
        "menu-open": "Open video",
        "menu-show": "在资料夹显示",
        "menu-remove": "移除下载项目",
        "menu-resume": "暂停/继续 下载",
        "m3u8-no-segments": "在m3u8档({1})里找不到影片",
        "server-code": "伺服器回应 HTTP {1} {2}"
    },
    "ja": {
         "menu-setting": "設定",
         "menu-open": "ビデオを開く",
         "menu-show": "フォルダー内に表示",
         "menu-remove": "削除",
         "menu-resume": "ダウンロードの一時停止/再開",
         "m3u8-no-segments": "m3u8 ファイル ({1}) にビデオが見つかりません",
         "server-code": "サーバーは HTTP {1} {2} で応答しました"
    }
}
const my_tr = translates[locale] || translates['en-us'];

module.exports = function (id, ...formats) {
    let str = my_tr[id];
    for (let i = 0;i < formats.length;++i)
        str = str.replaceAll(`{${i+1}}`, formats[i].toString());
    return str;
}
