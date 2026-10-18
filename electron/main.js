/* AK Knockout Studio — desktop wrapper.
   Opens the same index.html the web version uses, in its own window.
   The files are served from an app:// address (not file://) so the on-device
   AI models and WebAssembly can load, exactly as they do on a web server. */
const { app, BrowserWindow, Menu, shell, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.bin': 'application/octet-stream',
  '.tflite': 'application/octet-stream', '.binarypb': 'application/octet-stream', '.data': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
}]);

// Let the source video and its sound start without an extra click.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// The AI tools need WebGL. Allow it on graphics cards Chromium blocks, and fall
// back to software WebGL when there is no usable graphics card at all.
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

// One window at a time: a second launch focuses the existing one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: 'AK Knockout Studio',
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    backgroundColor: '#1d1e21', // matches the editor, so there is no white flash on start
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Keep playback and export running at full speed when the window is covered.
      backgroundThrottling: false,
    },
  });

  win.loadURL('app://studio/index.html');
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  // Links that would open a new window go to the normal browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // Never navigate the editor window away from the app itself.
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); }
  });

  win.on('closed', () => { win = null; });
}

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  // app://studio/<path> -> the file inside the app folder (never outside it)
  protocol.handle('app', async (req) => {
    try {
      const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '');
      const file = path.normalize(path.join(ROOT, rel || 'index.html'));
      if (!file.startsWith(ROOT)) return new Response('Forbidden', { status: 403 });
      const data = await fs.promises.readFile(file);
      return new Response(data, { headers: { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' } });
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  });

  // Exports, snapshots and project saves ask where to save, like any desktop app.
  session.defaultSession.on('will-download', (_e, item) => {
    item.setSaveDialogOptions({ title: 'Save file', defaultPath: item.getFilename() });
  });

  // A small menu that keeps the standard shortcuts (copy/paste, zoom, dev tools) working.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [{ role: 'quit', label: 'Exit' }] },
    { label: 'Edit', submenu: [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [{
        label: 'Project page on GitHub',
        click: () => shell.openExternal('https://github.com/AK30072002/ak-knockout-studio'),
      }],
    },
  ]));

  createWindow();
});

app.on('window-all-closed', () => app.quit());
