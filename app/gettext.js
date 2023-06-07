const locale = navigator.language.toLowerCase();

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
        "docuemnt-title": "影片下载器",
        "docuemnt-header": "影片下载器",
        "download-folder": "下载资料夹",
        "browse-path": "选择档案",
        "download": "下载",
        "url-placeholder": "输入连结",
        "choose-output": "选择输出格式",
        "offline": "你已离线",
        "complete-download": "下载完成: ${1}",
        "completed": "下载完成!",
        "invalid-url": "无效的连结: {1}",
        "url-required": "请输入一个连结",
        "folder-required": "请先选择下载资料夹",
        "converting": "转换中",
        "importing": "输入中",
        "server-error": "伺服器发生异常",
        "converting-progress": "转换中 进度({1}/100)",
        "waiting-input": "等待输入",
        "load-yt-info-failed": "无法取得影片资讯",
        "start-download": "开始下载"
    },
    "ja": {
        "docuemnt-title": "ビデオダウンローダー",
        "docuemnt-header": "ビデオダウンローダー",
        "download-folder": "ダウンロード フォルダー",
        "browse-path": "ファイルを選択",
        "download": "ダウンロード",
        "url-placeholder": "リンクを入力",
        "choose-output": "出力形式を選択します",
        "offline": "あなたはオフラインです",
        "complete-download": "ダウンロードが完了しました: ${1}",
        "completed": "ダウンロードが完了しました!",
        "invalid-url": "無効な URL: {1}",
        "url-required": "リンクを入力してください",
        "folder-required": "最初にダウンロード フォルダーを選択してください",
        "converting": "変換中",
        "converting-progress": "インポート中",
        "server-error": "サーバーで例外が発生しました",
        "converting-progress": "変換の進行状況 ({1}/100)",
        "waiting-input": "入力を待っています",
        "load-yt-info-failed": "ビデオ情報の取得に失敗しました",
        "start-download": "ダウンロードを開始"
    }
}
const my_tr = translates[locale] || translates['en-us'];

function gettext(id, ...formats) {
    let str = my_tr[id];
    for (let i = 0; i < formats.length; ++i)
        str = str.replaceAll(`{${i+1}}`, formats[i].toString());
    return str;
}