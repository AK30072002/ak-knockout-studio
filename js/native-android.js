/* AK Knockout Studio — Android additions
 *
 * Loaded only in the Android app (scripts/build-web.mjs adds it to the Android
 * build). Android's web view can't download files, so finished videos, photos
 * and project files are saved to Documents/AK Knockout Studio and then offered
 * in the share sheet (Gallery, Files, Drive, WhatsApp…). The phone's Back button
 * closes windows and returns to the start screen.
 */
(function () {
  'use strict';
  const KS = window.KS;
  const Cap = window.Capacitor;
  if (!KS || !Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;
  document.documentElement.classList.add('is-android');

  const fsx = window.capacitorFilesystemPluginCapacitor || window.capacitorFilesystem || {};
  const Filesystem = fsx.Filesystem || (Cap.Plugins && Cap.Plugins.Filesystem);
  const Directory = fsx.Directory || { Documents: 'DOCUMENTS', Cache: 'CACHE' };
  const Share = (window.capacitorShare || {}).Share || (Cap.Plugins && Cap.Plugins.Share);
  const App = (window.capacitorApp || {}).App || (Cap.Plugins && Cap.Plugins.App);
  const FOLDER = 'AK Knockout Studio';

  /* base64 of a slice of a blob (slices are multiples of 3 bytes, so pieces join cleanly) */
  const toB64 = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

  async function writeBlob(path, directory, blob, onProgress) {
    const CHUNK = 3 * 1024 * 1024;
    if (!blob.size) { await Filesystem.writeFile({ path, directory, data: '', recursive: true }); return; }
    for (let o = 0, first = true; o < blob.size; o += CHUNK, first = false) {
      const data = await toB64(blob.slice(o, o + CHUNK));
      if (first) await Filesystem.writeFile({ path, directory, data, recursive: true });
      else await Filesystem.appendFile({ path, directory, data });
      if (onProgress) onProgress(Math.min(1, (o + CHUNK) / blob.size));
    }
  }

  const unique = (name) => {
    const m = name.match(/^(.*?)(\.[^.]*)?$/);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `${m[1]}-${stamp}${m[2] || ''}`;
  };

  KS.native = {
    platform: 'android',
    /* Saves a file the editor would normally download. */
    async save(blob, filename) {
      if (!Filesystem) { KS.toast('Saving needs the Files permission. Please reinstall the app.', 6000); return; }
      const name = unique(filename);
      KS.toast(`Saving ${filename}…`, 60000);
      let uri = null, where = '';
      try {
        await writeBlob(`${FOLDER}/${name}`, Directory.Documents, blob);
        uri = (await Filesystem.getUri({ path: `${FOLDER}/${name}`, directory: Directory.Documents })).uri;
        where = `Saved to Documents/${FOLDER}.`;
      } catch (e) {
        try {
          await writeBlob(name, Directory.Cache, blob);
          uri = (await Filesystem.getUri({ path: name, directory: Directory.Cache })).uri;
          where = '';
        } catch (e2) {
          KS.toast('Could not save the file: ' + (e2.message || e2), 7000);
          return;
        }
      }
      KS.toast(where ? `${where} Choose where else to send it.` : 'Choose where to save or send it.', 5000);
      if (Share) {
        try { await Share.share({ title: filename, files: [uri], dialogTitle: 'Save or share' }); }
        catch (e) { /* closed the share sheet */ }
      }
    },
  };

  /* Back button: close a window, then go to the start screen, then leave the app. */
  if (App && App.addListener) {
    App.addListener('backButton', () => {
      const open = document.querySelector('dialog[open]');
      if (open) {
        if (!(KS.exporter && KS.exporter.active)) open.close();
        return;
      }
      if (KS.recorder && KS.recorder.active) { KS.recorder.stop(); return; }
      if (!KS.ui.home) { KS.app.goHome(); return; }
      App.exitApp();
    });
    // save the draft when the app goes to the background
    App.addListener('pause', () => { if (!KS.ui.home) KS.autosave(); });
  }
})();
