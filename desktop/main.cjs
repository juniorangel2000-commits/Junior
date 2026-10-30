const { app, BrowserWindow, Menu, dialog, protocol, net } = require('electron');
const path = require('node:path');
const { installFullscreenShortcut } = require('./fullscreen.cjs');
const { pathToFileURL } = require('node:url');
const { videoResponse } = require('./video-response.cjs');

// Origem fixa: o save não muda com a pasta temporária usada pelo .exe portátil.
protocol.registerSchemesAsPrivileged([
  { scheme: 'chuva', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

app.setName('After Rain');
app.setAppUserModelId('br.depoisdachuva.jogo');
// O caminho não depende da pasta do executável nem da versão do jogo.
app.setPath('userData', path.join(app.getPath('appData'), 'Depois da Chuva'));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'After Rain',
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#263e35',
    icon: path.join(__dirname, 'resources', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });
  installFullscreenShortcut(mainWindow);
  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = undefined; });
  mainWindow.loadURL('chuva://jogo/index.html').catch(() => {
    dialog.showErrorBox('Não foi possível abrir o jogo', 'Os arquivos do aplicativo não puderam ser carregados. Extraia ou baixe o pacote completo novamente.');
    app.quit();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    const root = path.resolve(__dirname, '..', 'dist');
    protocol.handle('chuva', async request => {
      try {
        const url = new URL(request.url);
        if (url.hostname !== 'jogo' || request.method !== 'GET') return new Response('Não encontrado.', { status: 404 });
        const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
        const file = path.resolve(root, `.${pathname}`);
        if (!file.startsWith(root + path.sep)) return new Response('Acesso não permitido.', { status: 403 });
        if (/\.(mp4|webm)$/i.test(file)) return await videoResponse(file, request.headers.get('range'));
        // O await mantém falhas de leitura dentro do handler (inclusive assets ausentes).
        return await net.fetch(pathToFileURL(file).toString());
      } catch {
        return new Response('Não foi possível carregar este arquivo.', { status: 400 });
      }
    });
    Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
