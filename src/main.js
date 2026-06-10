const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

let mainWindow;
let dataDir;

function getDataDir() {
  const dir = path.join(os.homedir(), 'Protolog');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function hashVersion(version) {
  const content = JSON.stringify({
    version: version.version,
    sections: version.sections || [],
    references: version.references || []
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

function createWindow() {
  dataDir = getDataDir();
  const iconPath = path.join(__dirname, 'icon.ico');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#ffffff',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.handle('window-close', () => mainWindow.close());
ipcMain.handle('get-data-dir', () => dataDir);

ipcMain.handle('list-protocols', () => {
  return fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
        return { id: f.replace('.json', ''), ...data.meta };
      } catch { return null; }
    }).filter(Boolean);
});

ipcMain.handle('load-protocol', (_, id) => {
  const fpath = path.join(dataDir, id + '.json');
  if (!fs.existsSync(fpath)) return null;
  return JSON.parse(fs.readFileSync(fpath, 'utf8'));
});

// Save always creates a new immutable version snapshot
ipcMain.handle('save-protocol', (_, protocol) => {
  const id = protocol.meta.id;
  const fpath = path.join(dataDir, id + '.json');

  let existing = null;
  if (fs.existsSync(fpath)) {
    existing = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  }

  const now = new Date().toISOString();

  // Build the version snapshot
  const newVersion = {
    version: protocol.meta.version,
    savedAt: now,
    editedBy: protocol.meta.editedBy || protocol.meta.author || 'Unknown',
    notes: protocol.meta.notes || '',
    sections: JSON.parse(JSON.stringify(protocol.sections || [])),
    references: JSON.parse(JSON.stringify(protocol.references || []))
  };
  // Compute integrity hash
  newVersion.hash = hashVersion(newVersion);

  const history = existing ? [...(existing.history || []), newVersion] : [newVersion];
  // Trim to 50 most recent, but always keep locked versions
  let trimmedHistory;
  if (history.length <= 50) {
    trimmedHistory = history;
  } else {
    const locked = history.filter(h => h.locked);
    const recent = history.slice(-50);
    const recentSet = new Set(recent);
    // Prepend any locked versions that fell outside the recent window
    const keptLocked = locked.filter(h => !recentSet.has(h));
    trimmedHistory = [...keptLocked, ...recent];
  }

  // Derive contributors
  const seen = new Set();
  const contributors = [];
  const origAuthor = existing
    ? (existing.meta.contributors?.[0]?.name || existing.meta.author)
    : protocol.meta.author;
  if (origAuthor) { seen.add(origAuthor); contributors.push({ name: origAuthor, role: 'Author' }); }
  for (const v of trimmedHistory) {
    if (v.editedBy && !seen.has(v.editedBy)) {
      seen.add(v.editedBy);
      contributors.push({ name: v.editedBy, role: 'Contributor' });
    }
  }

  const toSave = {
    meta: { ...protocol.meta, updatedAt: now, contributors },
    sections: protocol.sections || [],
    references: protocol.references || [],
    history: trimmedHistory
  };
  fs.writeFileSync(fpath, JSON.stringify(toSave, null, 2));
  return toSave;
});

ipcMain.handle('delete-protocol', (_, id) => {
  const fpath = path.join(dataDir, id + '.json');
  if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
  return true;
});

ipcMain.handle('export-protocol', async (_, id) => {
  const protocol = JSON.parse(fs.readFileSync(path.join(dataDir, id + '.json'), 'utf8'));
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: (protocol.meta.title || 'protocol').replace(/\s+/g, '_') + '_v' + protocol.meta.version + '.json',
    filters: [{ name: 'Protocol File', extensions: ['json'] }]
  });
  if (filePath) { fs.writeFileSync(filePath, JSON.stringify(protocol, null, 2)); return filePath; }
  return null;
});

// Stage import: read selected files, detect duplicates against existing protocols.
// Returns an array of staged items for the renderer to resolve.
ipcMain.handle('import-stage', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Protocol File', extensions: ['json'] }],
    properties: ['openFile', 'multiSelections']
  });

  // Build an index of existing protocols by title+version
  const existing = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
        return { id: f.replace('.json',''), title: (d.meta.title||'').trim().toLowerCase(), version: d.meta.version||'', hash: latestHash(d) };
      } catch { return null; }
    }).filter(Boolean);

  const staged = [];
  for (const fp of (filePaths || [])) {
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      const title = (data.meta.title||'Untitled');
      const version = data.meta.version||'';
      const incomingHash = latestHash(data);
      // Match by title + version
      const match = existing.find(e => e.title === title.trim().toLowerCase() && e.version === version);
      staged.push({
        title, version,
        identical: match ? (match.hash && incomingHash && match.hash === incomingHash) : false,
        duplicate: !!match,
        existingId: match ? match.id : null,
        // store the raw data as a string to pass back for commit
        payload: JSON.stringify(data)
      });
    } catch(e) { /* skip invalid file */ }
  }
  return staged;
});

// Commit a staged import with a resolved action: 'copy' | 'replace' | 'skip'
ipcMain.handle('import-commit', (_, item, action) => {
  if (action === 'skip') return null;
  let data;
  try { data = JSON.parse(item.payload); } catch { return null; }

  if (action === 'replace' && item.existingId) {
    data.meta.id = item.existingId;
    data.meta.importedAt = new Date().toISOString();
    fs.writeFileSync(path.join(dataDir, item.existingId + '.json'), JSON.stringify(data, null, 2));
    return data.meta.title;
  }

  // 'copy' (or new import): fresh id, mark title as copy if it was a duplicate
  const newId = (data.meta.id || 'proto') + '_imported_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  data.meta.id = newId;
  data.meta.importedAt = new Date().toISOString();
  if (action === 'copy' && item.duplicate) {
    data.meta.title = (data.meta.title || 'Untitled') + ' (copy)';
  }
  fs.writeFileSync(path.join(dataDir, newId + '.json'), JSON.stringify(data, null, 2));
  return data.meta.title;
});

// Helper: hash of the latest version snapshot (or top-level content)
function latestHash(d) {
  if (d.history && d.history.length) {
    const last = d.history[d.history.length - 1];
    if (last.hash) return last.hash;
  }
  try { return hashVersion({ version: d.meta.version, sections: d.sections||[], references: d.references||[] }); }
  catch { return null; }
}

// Persist history changes (lock toggles, version deletions) without creating a new version
ipcMain.handle('update-history', (_, id, history) => {
  const fpath = path.join(dataDir, id + '.json');
  if (!fs.existsSync(fpath)) return false;
  const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  data.history = history;
  data.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(fpath, JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('open-data-folder', () => shell.openPath(dataDir));

// Open an external URL in the user's default browser
ipcMain.handle('open-external', (_, url) => {
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
});

// Check GitHub Releases for a newer version. Returns {version, url, currentVersion} or null.
ipcMain.handle('check-for-update', async () => {
  const repo = (require('../package.json').repository || {}).url || '';
  // Expect a GitHub repo URL like https://github.com/USER/REPO(.git)
  const m = repo.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!m) return null;
  const [, owner, name] = m;
  const apiUrl = `https://api.github.com/repos/${owner}/${name}/releases/latest`;
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, {
        headers: { 'User-Agent': 'Protolog-Updater', 'Accept': 'application/vnd.github+json' },
        timeout: 5000
      }, res => {
        if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e){ reject(e); } });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    return {
      version: data.tag_name || data.name || '',
      url: data.html_url || `https://github.com/${owner}/${name}/releases/latest`,
      currentVersion: app.getVersion()
    };
  } catch (e) {
    return null;
  }
});

// Verify integrity of a version snapshot
ipcMain.handle('verify-hash', (_, version) => {
  const expected = version.hash;
  if (!expected) return { verified: false, reason: 'No hash stored' };
  const computed = hashVersion(version);
  return { verified: computed === expected, expected, computed };
});
