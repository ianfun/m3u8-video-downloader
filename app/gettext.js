const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();

const translates = {
    "en-us": {
        "docuemnt-title": "Video Downloader",
        "docuemnt-header": "Video Downloader",
        "download-folder": "Download Folder",
        "browse-path": "Browse",
        "download": "Download",
        "url-placeholder": "Paste URL here",
        "choose-output": "Choose output format",
        "offline": "You are offline",
        "complete-download": "Download finished: {1}",
        "completed": "Completed!",
        "invalid-url": "The input {1} is not a valid URL",
        "url-required": "Please enter a URL",
        "folder-required": "Please select output folder first!",
        "converting": "Converting",
        "importing": "Importing",
        "server-error": "An exception occurred on the server",
        "converting-progress": "Converting (progress {1}/100)",
        "waiting-input": "Waiting for input",
        "load-yt-info-failed": "Unable to get video information",
        "start-download": "Start download"
    },
    "zh-tw": {
        "docuemnt-title": "影片下載器",
        "docuemnt-header": "影片下載器",
        "download-folder": "下載資料夾",
        "browse-path": "選擇檔案",
        "download": "下載",
        "url-placeholder": "輸入連結",
        "choose-output": "選擇輸出格式",
        "offline": "你已離線",
        "complete-download": "下載完成: ${1}",
        "completed": "下載完成!",
        "invalid-url": "無效的連結: {1}",
        "url-required": "請輸入一個連結",
        "folder-required": "請先選擇下載資料夾",
        "converting": "轉換中",
        "importing": "輸入中",
        "server-error": "伺服器發生異常",
        "converting-progress": "轉換中 進度({1}/100)",
        "waiting-input": "等待輸入",
        "load-yt-info-failed": "無法取得影片資訊",
        "start-download": "開始下載"
    },
    "zh-cn": {
    },
    "ja": {
    }
}
const my_tr = translates[locale] || translates['en-us'];

function gettext(id, ...formats) {
    let str = my_tr[id];
    for (let i = 0;i < formats.length;++i)
        str = str.replaceAll(`{${i+1}}`, formats[i].toString());
    return str;
}
