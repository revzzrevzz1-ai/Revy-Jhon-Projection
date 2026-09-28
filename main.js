const {
    app,
    BrowserWindow,
    ipcMain,
    screen
} = require("electron");

const path = require("path");


/*
   NOTE: app.disableHardwareAcceleration() was removed on purpose.
   A transparent window (needed for the rounded corners) can turn
   black on Windows when hardware acceleration is disabled.
   If you ever get screen glitches, you can add it back and use
   the fallback described in the chat instead.
*/


/* =========================================
   WINDOW SIZES
========================================= */

/* Login window = the size of the login card */
const SMALL_WIDTH = 292;
const SMALL_HEIGHT = 460;


let win;


/* =========================================
   CREATE WINDOW
========================================= */

function createWindow() {

    win = new BrowserWindow({

        width: SMALL_WIDTH,
        height: SMALL_HEIGHT,

        /* size = web page area (no hidden borders) */
        useContentSize: true,

        /* open in the middle of the screen */
        center: true,

        /*
           Transparent + frameless = the rounded corners of the
           login card become the real corners of the window.
           (Transparent windows cannot be user-resized on Windows,
           so the window stays fixed-size and we change its size
           from code instead.)
        */
        frame: false,
        transparent: true,
        backgroundColor: "#00000000",

        resizable: false,
        maximizable: false,
        fullscreenable: false,

        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.js")
        }

    });


    win.loadFile("index.html");


    win.webContents.on(
        "did-fail-load",
        function (event, errorCode, errorDescription) {
            console.log("FAILED TO LOAD:", errorCode, errorDescription);
        }
    );

}


/* =========================================
   EXPAND WINDOW AFTER LOGIN
========================================= */

ipcMain.on("expand-window", function () {

    if (!win) return;

    /*
       "Maximize": fill the whole work area of the screen the
       window is on (everything except the taskbar).
       win.maximize() does not work on transparent windows,
       so we set the bounds ourselves.
    */
    const display = screen.getDisplayMatching(win.getBounds());

    win.setBounds(display.workArea);

});


/* =========================================
   SHRINK WINDOW (BACK TO LOGIN)
========================================= */

ipcMain.on("shrink-window", function () {

    if (!win) return;

    win.setSize(SMALL_WIDTH, SMALL_HEIGHT);

    win.center();

});


/* =========================================
   WINDOW BUTTONS (frameless window has no title bar)
========================================= */

ipcMain.on("minimize-window", function () {

    if (win) win.minimize();

});


ipcMain.on("close-window", function () {

    if (win) win.close();

});


/* =========================================
   ELECTRON READY
========================================= */

app.whenReady().then(createWindow);


/* =========================================
   CLOSE
========================================= */

app.on("window-all-closed", function () {

    if (process.platform !== "darwin") {
        app.quit();
    }

});