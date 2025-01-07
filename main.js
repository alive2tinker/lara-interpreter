// main.js
const { app, BrowserWindow, Menu, ipcMain, dialog} = require("electron");
const path = require('path');
const fs = require('fs');
let mainWindow;

function createWindow() {
  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create temp directory:', err);
    }
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      enableRemoteModule: false,
      contextIsolation: true,
      webSecurity: false, // Disable web security for local file access
    },
  });

  // Disable file watching completely
  mainWindow.webContents.session.setPreloads([]);
  
  // Prevent reload and navigation
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.on('will-redirect', (e) => e.preventDefault());
  
  // Disable refresh shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') {
      event.preventDefault();
    }
  });

  mainWindow.loadFile("index.html");
  mainWindow.setTitle('Electron App - No Directory Selected');
  
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools()
        },
        { type: 'separator' },
        { role: 'quit' }
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

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

app.on("ready", createWindow);

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