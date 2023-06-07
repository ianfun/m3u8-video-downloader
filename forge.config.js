module.exports = {
    "packagerConfig": {
        "icon": "./assets/icon"
    },
    "rebuildConfig": {},
    "makers": [/*{
            "name": "@electron-forge/maker-wix",
            "config": {
                "ui": {
                    "chooseDirectory": true,
                }
            }
        },*/
        {
            "name": "@electron-forge/maker-squirrel",
            "config": {
                "name": "video-downloader"
            }
        },
        {
            "name": "@electron-forge/maker-zip",
            "platforms": [
                "darwin"
            ]
        },
        {
            "name": "@electron-forge/maker-deb",
            "config": {
                "options": {
                    "icon": "./assets/icon.png"
                }
            }
        },
        {
            "name": "@electron-forge/maker-rpm",
            "config": {}
        }
    ]
};