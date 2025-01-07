// main.js
const { app, BrowserWindow, Menu, ipcMain, dialog} = require("electron");
const path = require('path');
let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      enableRemoteModule: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.setTitle('Electron App - No Directory Selected');
  const menu = Menu.buildFromTemplate([
    {
        label: 'File',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: 'CmdOrCtrl+Shift+I', // Shortcut for toggling
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
            },
            { role: 'quit' }, // Adds "Quit" option
        ],
    },
]);

ipcMain.handle('select-directory', async () => {
  try {
      const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openDirectory'], // Only allow directory selection
      });

      if (result.canceled) {
          return null; // User canceled the dialog
      }

      return result.filePaths[0]; // Return the selected directory path
  } catch (error) {
      console.error('Error selecting directory:', error);
      return null; // Return null on error
  }
});

// Set the custom menu
Menu.setApplicationMenu(menu);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    mainWindow.loadFile("index.html");
  }
});


ipcMain.on('update-title', (event, directory) => {
  if (mainWindow) {
      const title = directory
          ? `Electron App - ${directory}`
          : 'Electron App - No Directory Selected';
      mainWindow.setTitle(title);
  }
});