/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { exec, spawn } from 'child_process';
import { ReadlineParser, SerialPort } from 'serialport';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('get-usb-devices', async (event) => {
  exec('ls /dev/tty.usbmodem*', (error, stdout) => {
    if (error) {
      console.error(error);
      return;
    }
    mainWindow?.webContents.send('send-usb-devices', stdout);
  });
});

class SerialManager {
  conn: SerialPort | null;
  parser: ReadlineParser | null;
  connected: boolean;
  listeners: any[]; // any because i don't know where to find the type for IpcMain

  constructor() {
    this.conn = null;
    this.parser = null;
    this.connected = false;
    this.listeners = [];
  }

  connect(device: string) {
    if (this.conn) return;

    this.conn = new SerialPort({
      path: device,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
    });

    this.parser = this.conn.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    this.connected = true;

    this.parser.on('data', (data) => {
      mainWindow?.webContents.send('terminal-data', data);
    });

    // add event listeners to listener array
    this.listeners.push('send-command');
    this.listeners.push('enter-repl');
    this.listeners.push('exit-repl');
    this.listeners.push('check-connected');

    // register listeners
    ipcMain.on('send-command', (_, msg) => this.sendMessage(msg));
    ipcMain.on('enter-repl', () => this.enterRepl());
    ipcMain.on('exit-repl', () => this.exitRepl());
    ipcMain.on('check-connected', () => {
      mainWindow?.webContents.send('check-connected', this.connected);
    });
  }

  disconnect() {
    if (!this.conn) return;

    this.conn?.close();
    this.conn = null;
    this.parser = null;
    this.connected = false;

    for (const l of this.listeners) {
      ipcMain.removeAllListeners(l);
    }

    this.listeners = [];
  }

  sendMessage(message: string) {
    if (!this.conn) return;

    this.conn.write(`${message}\r\n`);
  }

  enterRepl() {
    if (!this.conn) return;

    this.conn.write(Buffer.from([0x03]));
    this.conn.write('a\r\n');
  }

  exitRepl() {
    if (!this.conn) return;

    this.conn.write(Buffer.from([0x04]));
    this.conn.write('a\r\n');
  }
}

const manager = new SerialManager();

ipcMain.on('connect-device', (event, device) => {
  manager.connect(device);
});

ipcMain.on('disconnect-device', () => {
  manager.disconnect();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  // Leaving this commented because it opens devtools every time the window opens
  // require('electron-debug')();
}

const createWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
