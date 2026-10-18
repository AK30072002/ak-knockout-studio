/* AK Knockout Studio — drafts
 *
 * Every project is saved automatically as a draft in the browser's own database
 * (IndexedDB), like the drafts list in a phone editor. A draft keeps:
 *   the project itself, a small thumbnail, every picture it uses, and a copy of
 *   its video and audio files, so it reopens complete without "Find the files".
 * Pictures and media files never change once added, so each is written only once
 * and shared between drafts.
 */
(function () {
  'use strict';
  const KS = window.KS;
  const DB_NAME = 'ak-knockout-studio';
  const MAX_MEDIA_BYTES = 1.5 * 1024 * 1024 * 1024; // larger files are not copied (relink instead)

  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('drafts')) d.createObjectStore('drafts', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('assets')) d.createObjectStore('assets', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('media')) d.createObjectStore('media', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbp.catch(() => { dbp = null; });
    return dbp;
  }
  const done = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
  const reqP = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

  async function put(store, value) {
    const d = await db();
    const tx = d.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    return done(tx);
  }
  async function get(store, key) {
    const d = await db();
    return reqP(d.transaction(store).objectStore(store).get(key));
  }
  async function getAll(store) {
    const d = await db();
    return reqP(d.transaction(store).objectStore(store).getAll());
  }
  async function del(store, key) {
    const d = await db();
    const tx = d.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    return done(tx);
  }
  async function keys(store) {
    const d = await db();
    return reqP(d.transaction(store).objectStore(store).getAllKeys());
  }

  /* Media keys used by a project (videos and sound files). */
  function mediaKeysOf(P) {
    const out = new Set();
    [...P.clips, ...P.overlays, ...P.audio].forEach((x) => {
      const m = KS.mediaLib.get(x.mediaId);
      const k = (m && m.key) || x.mediaKey;
      if (k) out.add(k);
    });
    return [...out];
  }
  function assetIdsOf(P) {
    const ids = new Set([P.background.imageId]);
    [...P.clips, ...P.overlays].forEach((x) => {
      ids.add(x.assetId); ids.add(x.originalAssetId);
      if (x.cutout) ids.add(x.cutout.maskId);
      if (x.backdrop) ids.add(x.backdrop.assetId);
    });
    ids.delete(null); ids.delete(undefined); ids.delete('');
    return [...ids];
  }

  function thumbnail() {
    const R = KS.renderer;
    if (!R || !R.cv || R.cv.width < 4) return '';
    try {
      const w = 320, h = Math.max(2, Math.round((w * R.cv.height) / R.cv.width));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = '#222'; x.fillRect(0, 0, w, h);
      x.drawImage(R.cv, 0, 0, w, h);
      return c.toDataURL('image/jpeg', 0.7);
    } catch (e) { return ''; }
  }

  const savedAssets = new Set();
  let saving = null, again = false;

  const D = (KS.drafts = {
    available: !!window.indexedDB,
    lastError: null,

    /* Saves the open project. Calls made while a save is running are merged. */
    save() {
      if (saving) { again = true; return saving; }
      saving = this._save().catch((e) => { this.lastError = e; console.warn('Draft save failed:', e); })
        .finally(() => { saving = null; if (again) { again = false; this.save(); } });
      return saving;
    },
    async _save() {
      const P = KS.project;
      const assetIds = assetIdsOf(P);
      for (const id of assetIds) {
        if (savedAssets.has(id) || !KS.assets[id]) continue;
        await put('assets', { id, dataURL: KS.assets[id].dataURL });
        savedAssets.add(id);
      }
      const mediaKeys = mediaKeysOf(P);
      for (const k of mediaKeys) {
        const m = Object.values(KS.mediaLib.items).find((x) => x.key === k);
        if (!m || m.stored || m.storeFailed) continue;
        if (m.file.size > MAX_MEDIA_BYTES) { m.storeFailed = true; continue; }
        try {
          await put('media', { key: k, name: m.name, type: m.file.type, size: m.file.size, blob: m.file });
          m.stored = true;
        } catch (e) { m.storeFailed = true; console.warn('Could not keep a copy of', m.name, e); }
      }
      await put('drafts', {
        id: P.id, name: P.name, mode: P.mode, updatedAt: Date.now(), version: KS.VERSION,
        thumb: thumbnail(), w: P.canvas.w, h: P.canvas.h,
        duration: P.mode === 'video' && KS.seq ? KS.seq.duration() : 0,
        project: JSON.parse(JSON.stringify(P)), assetIds, mediaKeys,
      });
      localStorage.setItem('akks.lastDraft', P.id);
      KS.emit('drafts');
    },

    /* Newest first, without the project payload. */
    async list() {
      try {
        const all = await getAll('drafts');
        return all.sort((a, b) => b.updatedAt - a.updatedAt)
          .map(({ project, ...meta }) => ({ ...meta, clips: project.clips.length }));
      } catch (e) { return []; }
    },

    async load(id) {
      const rec = await get('drafts', id);
      if (!rec) throw new Error('That draft no longer exists.');
      for (const aid of rec.assetIds || []) {
        if (KS.assets[aid]) { savedAssets.add(aid); continue; }
        const a = await get('assets', aid);
        if (a) { try { await KS.addImageAsset(a.dataURL, aid); savedAssets.add(aid); } catch (e) { /* skip */ } }
      }
      let offline = 0;
      for (const k of rec.mediaKeys || []) {
        if (Object.values(KS.mediaLib.items).some((m) => m.key === k)) continue;
        const m = await get('media', k);
        if (!m) { offline++; continue; }
        try {
          const file = new File([m.blob], m.name, { type: m.type || m.blob.type });
          const item = await KS.mediaLib.load(file, k);
          item.stored = true;
        } catch (e) { offline++; }
      }
      KS.replaceProject(rec.project);
      localStorage.setItem('akks.lastDraft', id);
      return { offline };
    },

    async remove(id) {
      await del('drafts', id);
      await this.gc();
      KS.emit('drafts');
    },

    async duplicate(id) {
      const rec = await get('drafts', id);
      if (!rec) return null;
      const copy = { ...rec, id: 'p_' + KS.uid(), name: rec.name + ' copy', updatedAt: Date.now() };
      copy.project = { ...rec.project, id: copy.id, name: copy.name };
      await put('drafts', copy);
      KS.emit('drafts');
      return copy.id;
    },

    /* Deletes pictures and media files that no draft uses any more. */
    async gc() {
      const all = await getAll('drafts');
      const keepA = new Set(), keepM = new Set();
      all.forEach((d) => { (d.assetIds || []).forEach((x) => keepA.add(x)); (d.mediaKeys || []).forEach((x) => keepM.add(x)); });
      // the open project's files stay too
      if (KS.project) { assetIdsOf(KS.project).forEach((x) => keepA.add(x)); mediaKeysOf(KS.project).forEach((x) => keepM.add(x)); }
      for (const k of await keys('assets')) if (!keepA.has(k)) { await del('assets', k); savedAssets.delete(k); }
      for (const k of await keys('media')) if (!keepM.has(k)) {
        await del('media', k);
        Object.values(KS.mediaLib.items).forEach((m) => { if (m.key === k) m.stored = false; });
      }
    },

    async usage() {
      try { const e = await navigator.storage.estimate(); return e; } catch (err) { return null; }
    },

    /* v1 and v2 kept one autosave in localStorage; it becomes a draft once. */
    async migrateLegacy() {
      try {
        if (localStorage.getItem('akks.migrated.v3')) return;
        const raw = localStorage.getItem(KS.LEGACY_AUTOSAVE_KEY);
        localStorage.setItem('akks.migrated.v3', '1');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !data.project) return;
        const P = KS.normalizeProject(data.project);
        for (const [aid, url] of Object.entries(data.assets || {})) await put('assets', { id: aid, dataURL: url });
        await put('drafts', {
          id: P.id, name: P.name, mode: P.mode, updatedAt: Date.now() - 1000, version: '2', thumb: '',
          w: P.canvas.w, h: P.canvas.h, duration: 0, project: P,
          assetIds: Object.keys(data.assets || {}), mediaKeys: [],
        });
      } catch (e) { /* nothing to migrate */ }
    },

    init() {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      return this.migrateLegacy();
    },
  });
  void D;
})();
