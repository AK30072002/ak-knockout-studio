/* AK Knockout Studio — project state, event bus, undo history, assets, autosave
 *
 * Project model (v3):
 *   mode     'video', 'photo' (one picture) or 'collage' (several pictures in a layout)
 *   clips    main video track, played in order (videos, photos, colour clips, demo)
 *   overlays pictures and videos placed on top (picture-in-picture, logos, stickers)
 *   audio    music, sound effects and voiceovers
 *   background, texts  as in v1
 * Video and audio files are never stored in project files; items remember the
 * file name (mediaName) so the file can be relinked. Drafts (KS.drafts) keep a
 * copy of the files in the browser's own storage so drafts reopen complete.
 */
(function () {
  'use strict';
  const KS = (window.KS = window.KS || {});
  KS.VERSION = '3.0.0';
  KS.APP_ID = 'ak-knockout-studio';

  /* ---------- tiny event bus ---------- */
  const listeners = {};
  KS.on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
  KS.emit = (evt, data) => { (listeners[evt] || []).forEach((fn) => fn(data)); };

  /* ---------- helpers ---------- */
  KS.uid = () => Math.random().toString(36).slice(2, 10);
  KS.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  KS.lerp = (a, b, t) => a + (b - a) * t;
  KS.even = (n) => Math.max(2, Math.round(n / 2) * 2);
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  KS.merge = function merge(base, over) {
    const out = { ...base };
    for (const k in over || {}) {
      if (isObj(base[k]) && isObj(over[k])) out[k] = merge(base[k], over[k]);
      else if (over[k] !== undefined) out[k] = over[k];
    }
    return out;
  };
  const pad = (n) => String(n).padStart(2, '0');
  KS.fmtTime = (t, fps = 30) => {
    t = Math.max(0, t || 0);
    const m = Math.floor(t / 60), s = Math.floor(t % 60), f = Math.floor((t % 1) * fps + 1e-6);
    return `${pad(m)}:${pad(s)}:${pad(f)}`;
  };
  KS.fmtSec = (t) => `${(Math.round(t * 100) / 100).toFixed(2)}s`;

  /* ---------- constants ---------- */
  KS.ASPECTS = {
    '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080],
    '4:5': [1080, 1350], '4:3': [1440, 1080], '21:9': [2560, 1080],
  };
  KS.FONTS = [
    'Anton', 'Bebas Neue', 'Archivo Black', 'Oswald', 'Montserrat', 'Playfair Display',
    'Roboto Slab', 'Bungee', 'Righteous', 'Permanent Marker', 'Pacifico', 'Lobster',
    'Impact', 'Arial Black', 'Georgia', 'Courier New',
  ];
  KS.customFonts = [];

  /* ---------- defaults ---------- */
  KS.defaultAnim = () => ({
    type: 'none', timing: 'duration', repeats: 1, speed: 180, loop: true, ease: 'linear',
    inDur: 1.2, freq: 0.6, amount: 1, gap: 160, reverse: false, fadeIn: 0.4, fadeOut: 0.4,
  });

  KS.defaultText = (over = {}) => KS.merge({
    id: KS.uid(), name: 'Text', visible: true, locked: false,
    text: 'YOUR TEXT', font: 'Anton', weight: '400', italic: false, size: 300,
    letterSpacing: 0, lineHeight: 1.0, align: 'center', uppercase: false,
    x: 0.5, y: 0.5, rotation: 0, scale: 1,
    mode: 'knockout', fill: '#ffffff', opacity: 1,
    stroke: { enabled: false, color: '#ffffff', width: 4 },
    shadow: { enabled: false, color: '#f44336', blur: 40, x: 0, y: 0 },
    start: 0, end: 10,
    anim: KS.defaultAnim(),
  }, over);

  KS.defaultFilters = () => ({
    brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0,
    temperature: 0, vignette: 0, sharpen: 0, grain: 0,
  });

  KS.defaultCutout = () => ({ ai: false, maskId: null, threshold: 0.5, feather: 3 });
  KS.defaultChroma = () => ({ enabled: false, color: '#00ff00', tolerance: 32, softness: 12 });

  KS.defaultClip = (over = {}) => KS.merge({
    id: KS.uid(), name: 'Demo source', kind: 'demo', mediaId: null, mediaName: '', mediaKey: '', assetId: null,
    originalAssetId: null, upscaled: 0,
    color: '#000000', duration: 10, srcDuration: 0, srcW: 0, srcH: 0,
    trimIn: 0, trimOut: null, speed: 1, volume: 1, muted: false, fadeIn: 0, fadeOut: 0,
    fit: 'cover', zoom: 1, offsetX: 0, offsetY: 0, rotation: 0, flipH: false, flipV: false,
    filters: KS.defaultFilters(), look: 'none',
    motion: { type: 'none', amount: 1 },
    transition: { type: 'none', dur: 0.6 },
    reverse: false,
    /* crop: null, or { x, y, w, h } (0..1 of the turned picture), rot (0/90/180/270), angle (straighten, degrees) */
    crop: null,
    cutout: KS.defaultCutout(),
    chroma: KS.defaultChroma(),
    /* what shows behind a cut-out subject */
    backdrop: { type: 'none', color: '#ffffff', gradA: '#ffd86f', gradB: '#fc6262', blur: 30, assetId: null },
  }, over);

  KS.defaultOverlay = (over = {}) => KS.merge({
    id: KS.uid(), name: 'Overlay', kind: 'image', assetId: null, mediaId: null, mediaName: '', mediaKey: '',
    originalAssetId: null, upscaled: 0, cutout: KS.defaultCutout(), sticker: false,
    srcW: 0, srcH: 0, srcDuration: 0, visible: true, locked: false,
    x: 0.72, y: 0.3, width: 0.34, rotation: 0, scale: 1, opacity: 1,
    radius: 0, border: { enabled: false, color: '#ffffff', width: 6 },
    shadow: { enabled: false, color: '#000000', blur: 30, x: 0, y: 10 },
    blend: 'source-over', above: true,
    chroma: { enabled: false, color: '#00ff00', tolerance: 32, softness: 12 },
    trimIn: 0, volume: 1, muted: true,
    start: 0, end: 10,
    anim: KS.merge(KS.defaultAnim(), { fadeIn: 0.3, fadeOut: 0.3 }),
  }, over);

  KS.defaultAudio = (over = {}) => KS.merge({
    id: KS.uid(), name: 'Audio', mediaId: null, mediaName: '', mediaKey: '', srcDuration: 0,
    start: 0, trimIn: 0, trimOut: null, volume: 1, muted: false, fadeIn: 0, fadeOut: 0, loop: false,
  }, over);

  KS.defaultProject = () => ({
    app: KS.APP_ID, version: 3, id: 'p_' + KS.uid(), mode: 'video', name: 'Untitled project',
    canvas: { aspect: '16:9', w: 1920, h: 1080, fps: 30 },
    collage: { layout: 0, spacing: 14, radius: 0, color: '#ffffff' },
    master: { volume: 1, muted: false },
    clips: [KS.defaultClip()],
    overlays: [],
    audio: [],
    background: {
      type: 'color', color: '#000000', gradA: '#101418', gradB: '#f44336', gradAngle: 135,
      gradKind: 'linear', imageId: null, imageFit: 'cover', blurAmount: 40, dim: 0.45, opacity: 1,
    },
    texts: [
      KS.defaultText({
        name: 'Title', text: 'AK\nSTUDIO', size: 440, lineHeight: 0.92, letterSpacing: 6,
        anim: { type: 'zoom-in', ease: 'back', inDur: 1.4, fadeIn: 0, fadeOut: 0.6 },
      }),
    ],
  });

  /* v1 projects had a single "source"; it becomes the first clip. */
  function clipFromV1Source(S) {
    const kind = S.kind === 'video' ? 'video' : S.kind === 'image' ? 'image' : 'demo';
    return KS.defaultClip({
      name: S.name || 'Source', kind, mediaName: kind === 'demo' ? '' : S.name,
      duration: S.duration || 10, trimIn: S.trimIn || 0, trimOut: S.trimOut ?? null,
      srcDuration: S.trimOut || 0,
      speed: S.speed || 1, volume: S.volume ?? 1, muted: !!S.muted,
      fit: S.fit, zoom: S.zoom, offsetX: S.offsetX, offsetY: S.offsetY, rotation: S.rotation,
      flipH: S.flipH, flipV: S.flipV, filters: KS.merge(KS.defaultFilters(), S.filters || {}),
    });
  }

  KS.normalizeProject = (p) => {
    const base = KS.defaultProject();
    const out = KS.merge(base, { ...p, texts: undefined, clips: undefined, overlays: undefined, audio: undefined, source: undefined });
    out.version = 3;
    if (!p.id) out.id = 'p_' + KS.uid();
    if (!['video', 'photo', 'collage'].includes(out.mode)) out.mode = 'video';
    out.texts = (p.texts || []).map((t) => KS.merge(KS.defaultText(), t));
    let clips = p.clips;
    if (!Array.isArray(clips) && p.source) clips = [clipFromV1Source(p.source)];
    out.clips = (clips || []).map((c) => KS.merge(KS.defaultClip(), c));
    if (!out.clips.length) out.clips = [KS.defaultClip()];
    out.overlays = (p.overlays || []).map((o) => KS.merge(KS.defaultOverlay(), o));
    out.audio = (p.audio || []).map((a) => KS.merge(KS.defaultAudio(), a));
    delete out.source;
    return out;
  };

  KS.project = KS.defaultProject();
  KS.ui = { selected: KS.project.texts[0].id, quality: 1, guides: false, loop: true, snapping: true };

  KS.getText = (id) => KS.project.texts.find((t) => t.id === id) || null;
  KS.selectedText = () => KS.getText(KS.ui.selected);
  KS.getClip = (id) => KS.project.clips.find((c) => c.id === id) || null;
  KS.getOverlay = (id) => KS.project.overlays.find((o) => o.id === id) || null;
  KS.getAudio = (id) => KS.project.audio.find((a) => a.id === id) || null;
  /* Anything selectable: returns { type, obj } or null. */
  KS.find = (id) => {
    if (!id) return null;
    if (id === 'background') return { type: 'background', obj: KS.project.background };
    let o;
    if ((o = KS.getText(id))) return { type: 'text', obj: o };
    if ((o = KS.getClip(id))) return { type: 'clip', obj: o };
    if ((o = KS.getOverlay(id))) return { type: 'overlay', obj: o };
    if ((o = KS.getAudio(id))) return { type: 'audio', obj: o };
    return null;
  };
  KS.selectedItem = () => KS.find(KS.ui.selected);
  /* Photo and collage projects are still pictures: no timeline, no playback. */
  KS.isPhoto = () => KS.project.mode !== 'video';
  KS.allIds = (p = KS.project) => [...p.texts, ...p.clips, ...p.overlays, ...p.audio].map((x) => x.id);
  KS.select = (id) => {
    if (id === 'source') id = KS.project.clips[0] ? KS.project.clips[0].id : null; // v1 name for the video
    if (KS.ui.selected === id) return;
    KS.ui.selected = id;
    KS.emit('select', id);
    KS.requestRender();
  };

  /* ---------- render scheduling ---------- */
  KS.dirty = true;
  KS.requestRender = () => { KS.dirty = true; };

  /* ---------- toast ---------- */
  let toastTimer = null;
  KS.toast = (msg, ms = 3200) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  };

  /* ---------- image assets (kept out of undo history) ---------- */
  KS.assets = {};
  KS.addImageAsset = (dataURL, id) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const key = id || 'img_' + KS.uid();
      KS.assets[key] = { dataURL, img };
      resolve(key);
    };
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = dataURL;
  });
  KS.fileToDataURL = (file, maxSide = 2560) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const png = /png|gif|webp|svg/.test(file.type);
      resolve(c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.92));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read ' + file.name)); };
    img.src = url;
  });
  KS.usedAssets = () => {
    const out = {};
    const P = KS.project;
    const ids = [P.background.imageId];
    for (const x of [...P.clips, ...P.overlays]) {
      ids.push(x.assetId, x.originalAssetId, x.cutout && x.cutout.maskId, x.backdrop && x.backdrop.assetId);
    }
    for (const id of ids) if (id && KS.assets[id]) out[id] = KS.assets[id].dataURL;
    return out;
  };

  /* ---------- undo / redo ---------- */
  KS.history = {
    stack: [], idx: -1, max: 150,
    push() {
      const snap = JSON.stringify(KS.project);
      if (this.stack[this.idx] === snap) return;
      this.stack = this.stack.slice(0, this.idx + 1);
      this.stack.push(snap);
      if (this.stack.length > this.max) this.stack.shift();
      this.idx = this.stack.length - 1;
      KS.emit('history');
    },
    reset() { this.stack = []; this.idx = -1; this.push(); },
    canUndo() { return this.idx > 0; },
    canRedo() { return this.idx < this.stack.length - 1; },
    undo() { if (this.canUndo()) { this.idx--; this.restore(); } },
    redo() { if (this.canRedo()) { this.idx++; this.restore(); } },
    restore() {
      const oldIds = new Set(KS.allIds());
      KS.project = JSON.parse(this.stack[this.idx]);
      const added = KS.allIds().find((id) => !oldIds.has(id));
      if (added) KS.ui.selected = added; // redo of "add" re-selects the item
      else if (KS.ui.selected && !KS.find(KS.ui.selected)) KS.ui.selected = null;
      KS.emit('project');
      KS.emit('history');
      KS.requestRender();
      scheduleAutosave();
    },
  };

  KS.commit = () => { KS.history.push(); scheduleAutosave(); };

  KS.replaceProject = (p, { resetHistory = true } = {}) => {
    KS.project = KS.normalizeProject(p);
    KS.ui.selected = KS.project.texts[0] ? KS.project.texts[0].id : null;
    if (resetHistory && KS.mediaLib) KS.mediaLib.autoRelink();
    if (resetHistory) KS.history.reset();
    KS.emit('project');
    KS.requestRender();
  };

  /* ---------- autosave ----------
   * Every change is saved as a draft (KS.drafts, IndexedDB). The old v1/v2
   * localStorage autosave is read once and turned into a draft. */
  KS.LEGACY_AUTOSAVE_KEY = 'akks.autosave.v1';
  let autosaveTimer = null;
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(KS.autosave, 900);
  }
  KS.scheduleAutosave = scheduleAutosave;
  KS.autosave = () => {
    clearTimeout(autosaveTimer);
    if (KS.drafts && !KS.ui.home) return KS.drafts.save();
    return Promise.resolve();
  };
})();
