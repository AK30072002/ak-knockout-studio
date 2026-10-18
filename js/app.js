/* AK Knockout Studio — application shell */
(function () {
  'use strict';
  const KS = window.KS;
  const $ = (id) => document.getElementById(id);
  const R = KS.renderer, pl = KS.player;

  const ICON = {
    text: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v2.5h-1.5V4.5H8.75v7h1.5V13h-4.5v-1.5h1.5v-7H4.5v1H3z"/></svg>',
    bg: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 12l3.5-4 2.5 2.5 1.5-1.5L13 12z"/></svg>',
    film: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 3v10M12 3v10M2 6h2M2 10h2M12 6h2M12 10h2" stroke="currentColor" stroke-width="1.2"/></svg>',
    eye: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2"/></svg>',
    eyeOff: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".45"/><path d="M2.5 13.5l11-11" stroke="currentColor" stroke-width="1.4"/></svg>',
    lock: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    unlock: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1" opacity=".45"/><path d="M5.5 7V5a2.5 2.5 0 015 0" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".45"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5v11l9-5.5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx=".5"/><rect x="9.5" y="2.5" width="3" height="11" rx=".5"/></svg>',
    overlay: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="10" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="7" y="7" width="7.5" height="6.5" rx="1"/></svg>',
    music: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.2l7-1.7v8.3a2 2 0 11-1.5-1.94V4.4L7.5 5.4v6.4a2 2 0 11-1.5-1.94z"/></svg>',
    sound: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z"/><path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    muted: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z" opacity=".5"/><path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" stroke-width="1.4"/></svg>',
  };
  KS.recorder = { active: false, stop() {} };

  const MODE_LABEL = { knockout: 'Video in text', inverse: 'Video around text', 'video-outline': 'Video outline', solid: 'Solid' };

  /* ---------- presets ---------- */
  const PRESETS = [
    ['title', 'Knockout title', () => ({ name: 'Title', text: 'YOUR\nTITLE', size: 420, lineHeight: 0.92, anim: { type: 'zoom-in', ease: 'back', inDur: 1.2, fadeIn: 0, fadeOut: 0.5 } })],
    ['credits', 'Credits roll (scroll up)', () => ({
      name: 'Credits', font: 'Montserrat', weight: '900', size: 104, lineHeight: 1.15,
      text: 'DIRECTED BY\nAJAIKRISHNA\n\nEDITED IN\nAK KNOCKOUT STUDIO\n\nMUSIC BY\nYOUR NAME HERE\n\nTHANKS FOR WATCHING',
      anim: { type: 'scroll-up', timing: 'duration', ease: 'linear', fadeIn: 0, fadeOut: 0 },
    })],
    ['ticker', 'News ticker (endless marquee)', () => ({
      name: 'Ticker', font: 'Bebas Neue', size: 130, y: 0.86,
      text: 'BREAKING  ✦  YOUR HEADLINE SCROLLS RIGHT HERE  ✦',
      anim: { type: 'marquee-h', speed: 260, gap: 80, fadeIn: 0, fadeOut: 0 },
    })],
    ['crawl', 'Perspective crawl', () => ({
      name: 'Crawl', font: 'Oswald', weight: '700', size: 120, lineHeight: 1.2,
      text: 'EPISODE ONE\n\nTHE VIDEO LIVES\nINSIDE THE LETTERS\nWHILE THE STORY\nDRIFTS INTO\nTHE DISTANCE',
      anim: { type: 'crawl', timing: 'duration', ease: 'linear', fadeIn: 0, fadeOut: 0 },
    })],
    ['zoom', 'Zoom-through reveal', () => ({ name: 'Zoom through', text: 'AK', size: 520, anim: { type: 'zoom-through', ease: 'linear', amount: 3, fadeIn: 0, fadeOut: 0 } })],
    ['side', 'Side scroll (ticker once)', () => ({ name: 'Side scroll', text: 'SCROLLING SIDEWAYS', size: 360, anim: { type: 'scroll-left', timing: 'duration', ease: 'linear', fadeIn: 0, fadeOut: 0 } })],
    ['vertical', 'Vertical endless loop', () => ({ name: 'Vertical loop', text: 'LOOP', size: 300, letterSpacing: 20, anim: { type: 'marquee-v', speed: 200, gap: 40, fadeIn: 0, fadeOut: 0 } })],
    ['diagonal', 'Diagonal sweep', () => ({ name: 'Diagonal', text: 'SWEEP', size: 320, rotation: -20, anim: { type: 'scroll-diag-up', timing: 'duration', ease: 'ease-in-out', fadeIn: 0, fadeOut: 0 } })],
    ['wave', 'Wavy headline', () => ({ name: 'Wave', text: 'MAKE WAVES', font: 'Bungee', size: 220, anim: { type: 'wave', freq: 0.8, amount: 1.2 } })],
    ['typewriter', 'Typewriter caption', () => ({
      name: 'Caption', text: 'Type your caption here', font: 'Courier New', weight: '700', size: 88, y: 0.84,
      mode: 'solid', fill: '#ffffff', shadow: { enabled: true, color: '#000000', blur: 18, x: 0, y: 4 },
      anim: { type: 'typewriter', inDur: 2, ease: 'linear' },
    })],
    ['frame', 'Video frame (video around text)', () => ({ name: 'Cut-out', text: 'CUT\nOUT', size: 460, lineHeight: 0.9, mode: 'inverse', anim: { type: 'pulse', freq: 0.5, amount: 0.6 } })],
    ['caption', 'Bold caption', () => ({
      name: 'Caption', text: 'YOUR CAPTION', font: 'Montserrat', weight: '900', size: 120, y: 0.85,
      mode: 'solid', fill: '#ffffff', stroke: { enabled: true, color: '#000000', width: 10 }, anim: { type: 'slide-up', inDur: 0.6, ease: 'back' },
    })],
    ['quote', 'Elegant quote', () => ({
      name: 'Quote', text: '“Every picture\ntells a story”', font: 'Playfair Display', weight: '700', italic: true, size: 150, lineHeight: 1.1,
      mode: 'solid', fill: '#ffffff', shadow: { enabled: true, color: '#000000', blur: 30, x: 0, y: 6 }, anim: { type: 'fade-letters', inDur: 1.5 },
    })],
    ['neon', 'Neon glow', () => ({
      name: 'Neon', text: 'NEON', font: 'Righteous', size: 300, mode: 'solid', fill: '#ffffff',
      shadow: { enabled: true, color: '#ff2bd6', blur: 70, x: 0, y: 0 }, stroke: { enabled: true, color: '#ff2bd6', width: 6 }, anim: { type: 'pulse', freq: 0.7, amount: 0.4 },
    })],
  ];
  /* Presets that make sense on a still picture (their animation is switched off there). */
  const PHOTO_PRESETS = new Set(['title', 'frame', 'caption', 'quote', 'neon', 'typewriter']);
  KS.COLLAGE_ASPECTS = { '1:1': [2160, 2160], '4:5': [2160, 2700], '3:4': [2160, 2880], '9:16': [2160, 3840], '16:9': [3840, 2160], '2:3': [2160, 3240] };

  /* ---------- helpers ---------- */
  const download = (blob, filename) => {
    if (KS.native && KS.native.save) { KS.native.save(blob, filename); return; } // Android app
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const safeName = () => (KS.project.name || 'project').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'project';
  const isTyping = (t) => t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !['range', 'checkbox', 'color', 'button'].includes(t.type)) || t.isContentEditable);

  const app = (KS.app = {
    /* ----- canvas size and stage layout ----- */
    setRenderSize(w, h) { R.setSize(w, h); KS.requestRender(); this.layoutStage(); },
    applyCanvasSize() {
      if (KS.exporter.active) return;
      const P = KS.project;
      // big photos are previewed at up to 2048 pixels; saving always uses the full size
      const q = KS.isPhoto() ? Math.min(KS.ui.quality, 2048 / Math.max(P.canvas.w, P.canvas.h)) : KS.ui.quality;
      this.setRenderSize(KS.even(P.canvas.w * q), KS.even(P.canvas.h * q));
    },
    /* Photo projects: the canvas is the picture's own size. */
    setPhotoCanvas(w, h) {
      const P = KS.project;
      const s = Math.min(1, KS.ai.MAX_OUTPUT / Math.max(w, h));
      Object.assign(P.canvas, { aspect: 'photo', w: Math.max(16, Math.round(w * s)), h: Math.max(16, Math.round(h * s)) });
      this.applyCanvasSize();
      setTimeout(() => KS.emit('refresh-inspector'), 0);
    },
    setCollageAspect(a) {
      const [w, h] = KS.COLLAGE_ASPECTS[a] || KS.COLLAGE_ASPECTS['1:1'];
      Object.assign(KS.project.canvas, { aspect: a, w, h });
      this.applyCanvasSize();
      setTimeout(() => KS.emit('refresh-inspector'), 0);
    },
    setAspect(a) {
      const P = KS.project;
      let w, h;
      if (a === 'source' && pl.width) {
        const s = Math.min(1, 3840 / Math.max(pl.width, pl.height));
        w = KS.even(pl.width * s); h = KS.even(pl.height * s);
      } else {
        [w, h] = KS.ASPECTS[a] || KS.ASPECTS['16:9'];
        a = KS.ASPECTS[a] ? a : '16:9';
      }
      Object.assign(P.canvas, { aspect: a, w, h });
      this.applyCanvasSize();
      KS.timeline.thumbsSoon();
      setTimeout(() => KS.emit('refresh-inspector'), 0);
    },
    layoutStage() {
      const stage = $('stage'), box = $('canvasBox'), ov = $('overlay');
      const r = stage.getBoundingClientRect();
      const pad = r.width < 500 ? 10 : 28;
      const aw = Math.max(40, r.width - pad * 2), ah = Math.max(40, r.height - pad * 2);
      const ratio = KS.project.canvas.w / KS.project.canvas.h;
      let w = aw, h = w / ratio;
      if (h > ah) { h = ah; w = h * ratio; }
      box.style.width = Math.floor(w) + 'px';
      box.style.height = Math.floor(h) + 'px';
      const dpr = window.devicePixelRatio || 1;
      ov.width = Math.max(2, Math.round(w * dpr));
      ov.height = Math.max(2, Math.round(h * dpr));
      KS.requestRender();
    },

    /* ----- file pickers ----- */
    pickMedia() { $('fileMedia').click(); },
    pickAudio() { $('fileAudio').click(); },
    pickOverlay(replaceId = null) { this._overlayTarget = replaceId; $('fileOverlay').click(); },
    pickReplace(clipId) { this._replaceTarget = clipId; $('fileClip').click(); },
    pickRelink() { $('fileRelink').click(); },
    pickBackgroundImage() { $('fileImage').click(); },
    pickFont() { $('fileFont').click(); },

    /* ----- importing ----- */
    async importFiles(files) {
      for (const f of files) await this.importMedia(f);
    },
    /* Videos and photos go on the video track, sound files become audio tracks. */
    async importMedia(file) {
      try {
        const kind = KS.mediaKind(file);
        if (kind === 'project') return this.openProject(file);
        if (kind === 'audio') return this.addAudioFile(file, { start: 0 }); // music from the main import starts at the beginning
        if (kind !== 'video' && kind !== 'image') throw new Error(`${file.name} isn’t a video, photo or sound file this editor can open.`);
        const P = KS.project;
        if (KS.isPhoto()) {
          if (kind !== 'image') { KS.toast('Photo projects use pictures. Start a Video project from Home to edit videos.', 5000); return; }
          if (P.mode === 'collage') return this.addCollagePhoto(file);
          return this.addOverlayFile(file);
        }
        KS.toast(`Opening ${file.name}…`, 1500);
        const m = kind === 'video' ? await KS.mediaLib.load(file) : null;
        if (m && this.tryRelink(m)) return;
        const c = await this.clipFromFile(file, m);
        this.insertClip(c);
      } catch (e) { KS.toast(e.message, 6000); }
    },
    /* Builds a clip for a video or photo. Pass loaded=true when the video was just loaded by importMedia. */
    async clipFromFile(file, loaded, maxSide = 3840) {
      if (KS.mediaKind(file) === 'video') {
        const m = loaded || await KS.mediaLib.load(file);
        return KS.defaultClip({
          name: file.name.replace(/\.[^.]+$/, ''), kind: 'video', mediaId: m.id, mediaName: m.name, mediaKey: m.key,
          srcDuration: m.duration, srcW: m.w, srcH: m.h, trimIn: 0, trimOut: m.duration,
        });
      }
      const url = await KS.fileToDataURL(file, maxSide);
      const id = await KS.addImageAsset(url);
      const img = KS.assets[id].img;
      return KS.defaultClip({ name: file.name.replace(/\.[^.]+$/, ''), kind: 'image', assetId: id, srcW: img.naturalWidth, srcH: img.naturalHeight, duration: 5 });
    },
    async addCollagePhoto(file) {
      const P = KS.project;
      if (P.clips.length >= KS.COLLAGE_MAX) { KS.toast(`A collage holds up to ${KS.COLLAGE_MAX} photos.`); return; }
      const c = await this.clipFromFile(file, null, 4096);
      const placeholder = P.clips.length === 1 && P.clips[0].kind === 'demo';
      if (placeholder) P.clips.splice(0, 1, c); else P.clips.push(c);
      P.collage.layout = 0;
      KS.commit(); KS.emit('layers'); KS.select(c.id); KS.requestRender();
      KS.toast(`Added photo ${P.clips.length}. Pick a layout under Collage.`);
    },
    /* Adds a clip to the end of the video track (the very first import replaces the demo). */
    insertClip(c, index) {
      const P = KS.project;
      const oldDur = pl.duration;
      const onlyDemo = P.clips.length === 1 && P.clips[0].kind === 'demo';
      if (onlyDemo && index == null) P.clips.splice(0, 1, c);
      else if (index == null) P.clips.push(c);
      else P.clips.splice(index, 0, c);
      this.stretchFullLength(oldDur);
      KS.commit(); KS.emit('layers'); KS.emit('duration');
      KS.select(c.id);
      if (onlyDemo) {
        KS.toast(`${c.name} is on the video track.`);
        if (c.srcW && KS.project.canvas.aspect !== 'source') {
          const ratio = c.srcW / c.srcH, cr = P.canvas.w / P.canvas.h;
          if (Math.abs(ratio - cr) > 0.05) setTimeout(() => KS.toast('This clip’s shape differs from the canvas. Choose “Match first clip” under Project to use its size.', 5000), 3300);
        }
      } else KS.toast(`Added ${c.name} as clip ${P.clips.indexOf(c) + 1}.`);
    },
    /* Layers that ran the whole length keep running the whole length when the video changes. */
    stretchFullLength(oldDur) {
      const D = pl.duration;
      [...KS.project.texts, ...KS.project.overlays].forEach((L) => {
        if (L.end >= oldDur - 0.02) L.end = D;
        if (L.start >= D) L.start = 0;
      });
    },
    tryRelink(m) {
      const n = KS.mediaLib.relink(m);
      if (!n) return false;
      KS.commit(); KS.pool.gc(); pl.sync(false);
      KS.emit('layers'); KS.emit('duration'); KS.emit('refresh-inspector');
      KS.toast(`Reconnected “${m.name}” (${n} item${n === 1 ? '' : 's'}).`);
      return true;
    },
    async relinkFiles(files) {
      let done = 0;
      for (const f of files) {
        const kind = KS.mediaKind(f);
        if (kind !== 'video' && kind !== 'audio') continue;
        try { const m = await KS.mediaLib.load(f); if (KS.mediaLib.relink(m)) done++; } catch (e) { KS.toast(e.message, 5000); }
      }
      KS.commit(); KS.pool.gc(); pl.sync(false);
      KS.emit('layers'); KS.emit('duration'); KS.emit('refresh-inspector');
      const left = KS.mediaLib.missingNames();
      KS.toast(left.length ? `Reconnected ${done} file${done === 1 ? '' : 's'}. Still missing: ${left.join(', ')}.` : `All media reconnected.`, 5000);
    },
    async replaceClipMedia(clipId, file) {
      try {
        const C = KS.getClip(clipId);
        if (!C) return;
        if (KS.isPhoto() && KS.mediaKind(file) !== 'image') { KS.toast('Choose a picture.'); return; }
        const n = await this.clipFromFile(file, null, KS.isPhoto() ? 6000 : 3840);
        const keep = ['id', 'fit', 'zoom', 'offsetX', 'offsetY', 'rotation', 'flipH', 'flipV', 'filters', 'look', 'motion', 'transition', 'volume', 'muted', 'fadeIn', 'fadeOut', 'speed'];
        keep.forEach((k) => { n[k] = C[k]; });
        if (n.kind !== 'video') n.duration = C.kind === 'video' ? KS.seq.len(C) : C.duration;
        const oldDur = pl.duration;
        Object.keys(C).forEach((k) => delete C[k]);
        Object.assign(C, n);
        if (KS.project.mode === 'photo' && KS.project.clips[0] === C) this.setPhotoCanvas(n.srcW, n.srcH);
        this.stretchFullLength(oldDur);
        KS.pool.gc();
        KS.commit(); KS.emit('layers'); KS.emit('duration'); KS.emit('refresh-inspector');
        pl.seek(Math.min(pl.t, pl.duration));
        KS.toast(`Replaced with ${file.name}.`);
      } catch (e) { KS.toast(e.message, 6000); }
    },
    useDemo(clipId) {
      const C = KS.getClip(clipId);
      if (!C) return;
      const oldDur = pl.duration;
      Object.assign(C, { kind: 'demo', name: 'Demo source', mediaId: null, mediaName: '', assetId: null, duration: 10, trimIn: 0, trimOut: null });
      this.stretchFullLength(oldDur);
      KS.pool.gc();
      KS.commit(); KS.emit('layers'); KS.emit('duration'); KS.emit('refresh-inspector');
    },
    async setBackgroundImage(file) {
      try {
        const url = await KS.fileToDataURL(file);
        const id = await KS.addImageAsset(url);
        const B = KS.project.background;
        B.imageId = id; B.type = 'image';
        if (B.opacity === 0) B.opacity = 1;
        KS.commit(); KS.requestRender(); KS.emit('layers');
        KS.select('background'); KS.emit('refresh-inspector');
        KS.toast('Background image set. (Hold Shift while dropping to add a picture as an overlay instead.)');
      } catch (e) { KS.toast(e.message, 5000); }
    },
    async loadFont(file) {
      try {
        const family = file.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, ' ').trim() || 'Custom font';
        const face = new FontFace(family, await file.arrayBuffer());
        await face.load();
        document.fonts.add(face);
        if (!KS.customFonts.includes(family)) KS.customFonts.push(family);
        const L = KS.selectedText();
        if (L) { L.font = family; KS.commit(); }
        KS.requestRender(); KS.emit('refresh-inspector');
        KS.toast(`Font “${family}” added for this session.`);
      } catch (e) { KS.toast('That font file could not be loaded. Use a .ttf, .otf, .woff or .woff2 file.', 5000); }
    },
    addColorClip() {
      this.insertClip(KS.defaultClip({ name: 'Colour clip', kind: 'color', color: '#000000', duration: 3 }), KS.project.clips.length);
    },

    async addAudioFile(file, over = {}) {
      try {
        const m = await KS.mediaLib.load(file);
        if (!over.forceNew && this.tryRelink(m)) return null;
        const D = pl.duration;
        const start = over.start != null ? over.start : (pl.t < D - 0.2 ? Math.round(pl.t * 1000) / 1000 : 0);
        const a = KS.defaultAudio({
          name: over.name || file.name.replace(/\.[^.]+$/, ''), mediaId: m.id, mediaName: m.name, mediaKey: m.key,
          srcDuration: m.duration, trimOut: m.duration, start,
        });
        KS.project.audio.push(a);
        KS.commit(); KS.emit('layers'); KS.select(a.id);
        pl.sync(pl.playing);
        if (!over.quiet) KS.toast(`Added “${a.name}” at ${KS.fmtSec(start)}. Drag it on the timeline to move it.`);
        return a;
      } catch (e) { KS.toast(e.message, 6000); return null; }
    },

    async addOverlayFile(file, replaceId) {
      try {
        const kind = KS.mediaKind(file);
        if (kind !== 'video' && kind !== 'image') throw new Error('Overlays can be photos, pictures with transparency (PNG) or videos.');
        let src;
        if (kind === 'video') {
          const m = await KS.mediaLib.load(file);
          src = { kind: 'video', mediaId: m.id, mediaName: m.name, mediaKey: m.key, assetId: null, srcW: m.w, srcH: m.h, srcDuration: m.duration };
        } else {
          const url = await KS.fileToDataURL(file, KS.isPhoto() ? 4096 : 2560);
          const id = await KS.addImageAsset(url);
          const img = KS.assets[id].img;
          src = { kind: 'image', assetId: id, mediaId: null, mediaName: '', srcW: img.naturalWidth, srcH: img.naturalHeight, originalAssetId: null, upscaled: 0, cutout: KS.defaultCutout() };
        }
        const O = replaceId && KS.getOverlay(replaceId);
        if (O) {
          Object.assign(O, src, { trimIn: 0 });
          KS.pool.gc();
          KS.commit(); KS.emit('layers'); KS.emit('refresh-inspector');
          KS.toast(`Replaced with ${file.name}.`);
          return;
        }
        const D = pl.duration;
        const start = pl.t < D - 0.3 ? Math.round(pl.t * 1000) / 1000 : 0;
        const end = kind === 'video' ? Math.min(D, start + src.srcDuration) : D;
        const n = KS.project.overlays.length + 1;
        const ov = KS.defaultOverlay({ ...src, name: `${kind === 'video' ? 'Video' : 'Picture'} ${n}`, start, end });
        KS.project.overlays.push(ov);
        KS.commit(); KS.emit('layers'); KS.select(ov.id);
        pl.sync(pl.playing);
        KS.toast('Overlay added. Drag it on the stage to place it.');
      } catch (e) { KS.toast(e.message, 6000); }
    },

    /* ----- voiceover recording ----- */
    async toggleRecord() {
      const rc = KS.recorder;
      if (KS.isPhoto()) return;
      if (rc.active) { rc.stop(); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
        KS.toast('Recording needs microphone access, which this browser doesn’t offer.', 5000); return;
      }
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch (e) { KS.toast('Microphone access was blocked. Allow it in your browser or system settings and try again.', 6000); return; }
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      const startT = pl.t >= pl.duration - 0.1 ? 0 : pl.t;
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        rc.active = false; syncRec();
        pl.pause();
        if (!chunks.length) return;
        const n = KS.project.audio.filter((a) => /^Voiceover/.test(a.name)).length + 1;
        const type = (mime || 'audio/webm').split(';')[0];
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const file = new File(chunks, `Voiceover-${stamp}.${ext}`, { type });
        const a = await this.addAudioFile(file, { start: startT, name: `Voiceover ${n}`, forceNew: true, quiet: true });
        if (a) {
          download(file, file.name);
          KS.toast(`Voiceover ${n} added. A copy was saved to your downloads so you can reopen this project later.`, 6000);
        }
      };
      rc.active = true; rc.stop = () => { if (mr.state !== 'inactive') mr.stop(); };
      syncRec();
      pl.seek(startT);
      mr.start(250);
      pl.play();
      KS.toast('Recording… Press the record button again (or R) to stop. Headphones stop echo.', 4000);
    },

    /* ----- selection-aware editing (text, clip, overlay, audio) ----- */
    addText(over = {}) {
      const P = KS.project;
      const n = P.texts.length + 1;
      // with no background, knockout text would be invisible, so new text is solid
      const plain = P.background.type === 'none' || P.background.opacity === 0;
      const base = { name: `Text ${n}`, text: 'YOUR TEXT', start: 0, end: pl.duration };
      if (plain && !over.mode) Object.assign(base, { mode: 'solid', fill: '#ffffff', shadow: { enabled: true, color: '#000000', blur: 24, x: 0, y: 4 }, size: KS.isPhoto() ? 140 : 300 });
      const L = KS.defaultText(KS.merge(base, over));
      L.id = KS.uid();
      L.end = Math.min(L.end, pl.duration);
      P.texts.push(L);
      KS.commit();
      KS.emit('layers');
      KS.ui.selected = null;
      KS.select(L.id);
      return L;
    },
    addPreset(key) {
      const p = PRESETS.find((x) => x[0] === key);
      if (!p) return;
      const over = p[2]();
      over.anim = KS.merge(KS.defaultAnim(), KS.isPhoto() ? {} : over.anim || {});
      const P = KS.project, B = P.background;
      const needsBg = (!over.mode || over.mode === 'knockout' || over.mode === 'inverse' || over.mode === 'video-outline') && (B.type === 'none' || B.opacity === 0);
      if (needsBg) { Object.assign(B, { type: 'color', color: '#000000', opacity: 1 }); if (!over.mode) over.mode = 'knockout'; }
      this.addText(over);
      KS.toast(needsBg
        ? `Added “${p[1]}”. The background is now black so your ${KS.isPhoto() ? 'photo' : 'video'} shows only inside the letters; change it under Background.`
        : `Added “${p[1]}”. Adjust it in the panel on the right.`, needsBg ? 6000 : 3200);
    },
    duplicate() {
      const f = KS.selectedItem();
      if (!f || f.type === 'background') return;
      if (f.type === 'clip' && KS.project.mode === 'photo') { KS.toast('A photo project has one photo. Add more pictures as overlays.'); return; }
      if (f.type === 'clip' && KS.project.mode === 'collage' && KS.project.clips.length >= KS.COLLAGE_MAX) { KS.toast(`A collage holds up to ${KS.COLLAGE_MAX} photos.`); return; }
      const P = KS.project, L = f.obj;
      const copy = JSON.parse(JSON.stringify(L));
      copy.id = KS.uid();
      copy.name = L.name + ' copy';
      if (f.type === 'text') { copy.y = Math.min(1, L.y + 0.05); P.texts.splice(P.texts.indexOf(L) + 1, 0, copy); }
      else if (f.type === 'overlay') { copy.x = Math.min(1, L.x + 0.04); copy.y = Math.min(1, L.y + 0.04); P.overlays.splice(P.overlays.indexOf(L) + 1, 0, copy); }
      else if (f.type === 'clip') {
        const oldDur = pl.duration;
        P.clips.splice(P.clips.indexOf(L) + 1, 0, copy);
        this.stretchFullLength(oldDur);
        KS.emit('duration');
      } else if (f.type === 'audio') { copy.start = Math.round(KS.mix.audioEnd(L) * 1000) / 1000; copy.loop = false; P.audio.splice(P.audio.indexOf(L) + 1, 0, copy); }
      KS.commit(); KS.emit('layers'); KS.select(copy.id);
      KS.toast(`Duplicated “${L.name}”.`, 1800);
    },
    removeSelected() {
      const f = KS.selectedItem();
      if (!f || f.type === 'background') return;
      const P = KS.project, L = f.obj;
      const arr = { text: P.texts, clip: P.clips, overlay: P.overlays, audio: P.audio }[f.type];
      if (f.type === 'clip' && arr.length === 1) { KS.toast(KS.isPhoto() ? 'This is the only photo. Use “Replace photo” to swap it.' : 'The video track needs at least one clip. Use “Replace media” to swap it.', 4500); return; }
      const i = arr.indexOf(L);
      const oldDur = pl.duration;
      arr.splice(i, 1);
      if (f.type === 'clip') { this.stretchFullLength(oldDur); KS.pool.gc(); KS.emit('duration'); }
      if (f.type === 'overlay' || f.type === 'audio') KS.pool.release(L.id);
      const next = arr[Math.min(i, arr.length - 1)];
      KS.commit(); KS.emit('layers');
      KS.select(next ? next.id : null);
      pl.seek(Math.min(pl.t, pl.duration));
      KS.toast(`Deleted “${L.name}”. Press Ctrl+Z to bring it back.`);
    },
    move(dir) {
      const f = KS.selectedItem();
      if (!f) return;
      const P = KS.project;
      const arr = { text: P.texts, clip: P.clips, overlay: P.overlays }[f.type];
      if (!arr) return;
      const i = arr.indexOf(f.obj), j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      KS.commit(); KS.emit('layers'); KS.requestRender();
      if (f.type === 'clip') { KS.emit('duration'); KS.toast(`Moved to position ${j + 1} on the video track.`, 1600); }
    },
    split() {
      if (KS.isPhoto()) return;
      const f = KS.selectedItem();
      const t = pl.t;
      const P = KS.project;
      if (!f || f.type === 'background') {
        const e = pl.entry();
        if (e) { KS.select(e.clip.id); this.split(); }
        return;
      }
      const L = f.obj;
      if (f.type === 'clip') {
        const b = this.splitClipAt(L, t);
        if (b) { KS.commit(); KS.emit('layers'); KS.emit('duration'); KS.select(b.id); KS.toast(`Split at ${KS.fmtSec(t)}.`); }
        return;
      }
      if (f.type === 'audio') {
        if (L.loop) { KS.toast('Turn off “Repeat until the video ends” before splitting this track.'); return; }
        const end = KS.mix.audioEnd(L);
        if (t <= L.start + 0.05 || t >= end - 0.05) { KS.toast('Move the playhead inside the track to split it.'); return; }
        const copy = JSON.parse(JSON.stringify(L));
        copy.id = KS.uid(); copy.name = L.name + ' (2)';
        const cut = L.trimIn + (t - L.start);
        L.trimOut = cut; L.fadeOut = 0; copy.start = t; copy.trimIn = cut; copy.fadeIn = 0;
        P.audio.splice(P.audio.indexOf(L) + 1, 0, copy);
        KS.commit(); KS.emit('layers'); KS.select(copy.id); KS.toast(`Split at ${KS.fmtSec(t)}.`);
        return;
      }
      if (t <= L.start + 0.05 || t >= L.end - 0.05) { KS.toast('Move the playhead inside the layer’s time range to split it.'); return; }
      const copy = JSON.parse(JSON.stringify(L));
      copy.id = KS.uid();
      copy.name = L.name + ' (2)';
      copy.start = t;
      if (f.type === 'overlay' && L.kind === 'video') copy.trimIn = L.trimIn + (t - L.start);
      L.end = t;
      const arr = f.type === 'text' ? P.texts : P.overlays;
      arr.splice(arr.indexOf(L) + 1, 0, copy);
      KS.commit(); KS.emit('layers'); KS.select(copy.id);
      KS.toast(`Split at ${KS.fmtSec(t)}.`);
    },
    /* Cuts a clip in two at timeline time t; returns the second half (or null). */
    splitClipAt(C, t) {
      const e = KS.seq.layout().find((x) => x.clip === C);
      if (!e || t <= e.start + 0.05 || t >= e.end - 0.05) { KS.toast('Move the playhead inside the clip to split it.'); return null; }
      const local = t - e.start;
      const B = JSON.parse(JSON.stringify(C));
      B.id = KS.uid();
      B.name = C.name + ' (2)';
      B.transition = { type: 'none', dur: C.transition.dur };
      if (C.kind === 'video') {
        const cut = Math.round(KS.seq.srcTime(e, t) * 1000) / 1000;
        if (C.reverse) { B.trimOut = cut; C.trimIn = cut; } // reversed: the first part is the later footage
        else { C.trimOut = cut; B.trimIn = cut; }
        C.fadeOut = 0; B.fadeIn = 0;
      } else {
        B.duration = Math.round((e.len - local) * 100) / 100;
        C.duration = Math.round(local * 100) / 100;
      }
      KS.project.clips.splice(KS.project.clips.indexOf(C) + 1, 0, B);
      return B;
    },
    async freezeFrame() {
      const e = pl.entry();
      if (!e) return;
      pl.pause();
      await pl.seekAsync(pl.t);
      const P = KS.project;
      const cv = document.createElement('canvas');
      cv.width = P.canvas.w; cv.height = P.canvas.h;
      R.renderClip(cv, e, pl.t, cv.width, cv.height, Math.min(cv.width, cv.height) / 1080);
      const id = await KS.addImageAsset(cv.toDataURL('image/jpeg', 0.95));
      const F = KS.defaultClip({ name: `Freeze frame ${KS.fmtSec(pl.t)}`, kind: 'image', assetId: id, srcW: cv.width, srcH: cv.height, duration: 2 });
      const C = e.clip;
      const inside = pl.t > e.start + 0.05 && pl.t < e.end - 0.05;
      const oldDur = pl.duration;
      if (inside) this.splitClipAt(C, pl.t);
      const at = P.clips.indexOf(C) + 1;
      P.clips.splice(at, 0, F);
      this.stretchFullLength(oldDur);
      KS.commit(); KS.emit('layers'); KS.emit('duration'); KS.select(F.id);
      KS.toast('Freeze frame added (2 seconds). Change its length under Duration.');
    },
    extractAudio(clipId) {
      const C = KS.getClip(clipId);
      if (!C || C.kind !== 'video' || !KS.mediaLib.get(C.mediaId)) { KS.toast('This needs a loaded video clip.'); return; }
      if (C.speed !== 1) { KS.toast('Set the clip’s speed to 1× first; audio tracks always play at normal speed.', 5000); return; }
      const e = KS.seq.layout().find((x) => x.clip === C);
      const a = KS.defaultAudio({
        name: `${C.name} (sound)`, mediaId: C.mediaId, mediaName: C.mediaName, mediaKey: C.mediaKey, srcDuration: KS.seq.srcLen(C),
        start: e.start, trimIn: C.trimIn, trimOut: KS.seq.outPoint(C), volume: C.volume, fadeIn: C.fadeIn, fadeOut: C.fadeOut,
      });
      C.muted = true;
      KS.project.audio.push(a);
      KS.commit(); KS.emit('layers'); KS.select(a.id); pl.sync(pl.playing);
      KS.toast('The clip’s sound is now its own track, and the clip is muted. Move or cut the sound separately.', 5000);
    },

    /* ----- trimming the clip under the playhead ----- */
    trimTarget() {
      const f = KS.selectedItem();
      const lay = KS.seq.layout();
      if (f && f.type === 'clip') {
        const e = lay.find((x) => x.clip === f.obj);
        if (e && pl.t >= e.start - 1e-6 && pl.t <= e.end + 1e-6) return e;
      }
      return KS.seq.entryAt(pl.t, lay);
    },
    setIn() {
      const e = this.trimTarget();
      if (!e || e.clip.kind !== 'video') { KS.toast('Trimming needs a video clip under the playhead.'); return; }
      const C = e.clip, s = KS.seq.srcTime(e, pl.t);
      if (s >= KS.seq.outPoint(C) - 0.1) { KS.toast('The in point must come before the out point.'); return; }
      C.trimIn = Math.round(s * 1000) / 1000;
      KS.commit(); KS.emit('duration'); pl.seek(e.start); KS.emit('refresh-inspector');
      KS.toast(`In point set at ${KS.fmtSec(s)} of “${C.name}”.`);
    },
    setOut() {
      const e = this.trimTarget();
      if (!e || e.clip.kind !== 'video') { KS.toast('Trimming needs a video clip under the playhead.'); return; }
      const C = e.clip, s = KS.seq.srcTime(e, pl.t);
      if (s <= C.trimIn + 0.1) { KS.toast('The out point must come after the in point.'); return; }
      C.trimOut = Math.round(s * 1000) / 1000;
      KS.commit(); KS.emit('duration');
      const ne = KS.seq.layout().find((x) => x.clip === C);
      pl.seek(Math.max(0, (ne ? ne.end : pl.duration) - 0.001)); KS.emit('refresh-inspector');
      KS.toast(`Out point set at ${KS.fmtSec(s)} of “${C.name}”.`);
    },

    /* ----- output ----- */
    async snapshot() {
      const P = KS.project;
      R.setSize(P.canvas.w, P.canvas.h);
      await pl.seekAsync(pl.t);
      R.render(pl.t);
      const blob = await new Promise((r) => R.cv.toBlob(r, 'image/png'));
      this.applyCanvasSize();
      if (blob) { download(blob, `${safeName()}-${KS.fmtTime(pl.t, P.canvas.fps).replace(/:/g, '-')}.png`); KS.toast('Snapshot saved as PNG.'); }
    },
    saveProject() {
      const data = { app: KS.APP_ID, version: KS.VERSION, savedAt: new Date().toISOString(), project: KS.project, assets: KS.usedAssets() };
      download(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), `${safeName()}.akks.json`);
      KS.toast('Project saved. Photos are inside the file; keep your videos and music alongside it.');
    },
    async openProject(file) {
      try {
        const data = JSON.parse(await file.text());
        const project = data.project || data;
        if (!project || !Array.isArray(project.texts)) throw new Error('bad');
        for (const [id, url] of Object.entries(data.assets || {})) await KS.addImageAsset(url, id);
        KS.replaceProject(project);
        if (KS.ui.home) KS.home.hide();
        this.afterProjectChange();
        $('projectName').value = KS.project.name;
        KS.timeline.fit();
        const miss = KS.mediaLib.missingNames();
        KS.toast(miss.length ? `Project opened. Find these files to bring them back: ${miss.join(', ')}.` : 'Project opened.', miss.length ? 7000 : 3000);
        if (miss.length) KS.select(null);
      } catch (e) { KS.toast('That file isn’t an AK Knockout Studio project.', 5000); }
    },
    /* "New" goes back to the start screen; the current project stays in Drafts. */
    newProject() { this.goHome(); },
    async goHome() {
      pl.pause();
      if (KS.recorder.active) KS.recorder.stop();
      if (KS.history.canUndo()) await KS.autosave();
      KS.home.show();
    },

    /* Starts a new video, photo or collage project, as on a phone editor's start screen. */
    async startNew(mode, files = [], { aspect = 'auto', demo = false } = {}) {
      if (KS.history.canUndo()) await KS.autosave();
      const base = KS.defaultProject();
      base.mode = mode;
      if (!demo) {
        base.texts = [];
        base.background.type = 'none';
        base.name = { video: 'My video', photo: 'My photo', collage: 'My collage' }[mode];
      }
      if (mode === 'collage') { const [w, h] = KS.COLLAGE_ASPECTS['1:1']; Object.assign(base.canvas, { aspect: '1:1', w, h }); }
      KS.replaceProject(base);
      KS.home.hide();
      pl.pause(); pl.t = 0;
      this.afterProjectChange();
      const P = KS.project;
      try {
        if (mode === 'photo' && files[0]) {
          KS.toast(`Opening ${files[0].name}…`, 1500);
          const c = await this.clipFromFile(files[0], null, 6000);
          P.clips = [c];
          P.name = c.name;
          this.setPhotoCanvas(c.srcW, c.srcH);
        } else if (mode === 'collage' && files.length) {
          const imgs = files.filter((f) => KS.mediaKind(f) === 'image').slice(0, KS.COLLAGE_MAX);
          const cells = [];
          for (const f of imgs) cells.push(await this.clipFromFile(f, null, 4096));
          if (cells.length) P.clips = cells;
          if (files.length > KS.COLLAGE_MAX) KS.toast(`A collage holds up to ${KS.COLLAGE_MAX} photos; the first ${KS.COLLAGE_MAX} were used.`, 5000);
        } else if (mode === 'video' && files.length) {
          await this.importFiles(files);
          if (aspect === 'auto' && pl.width) this.setAspect('source');
          else if (KS.ASPECTS[aspect]) this.setAspect(aspect);
        } else if (mode === 'video' && KS.ASPECTS[aspect]) this.setAspect(aspect);
      } catch (e) { KS.toast(e.message, 6000); }
      $('projectName').value = P.name;
      KS.history.reset();
      KS.commit();
      KS.emit('project');
      KS.timeline.fit();
      if (mode !== 'video') KS.select(P.clips[0].id);
      else if (demo) pl.seek(Math.min(2, pl.duration));
      KS.autosave();
    },
    async openDraft(id) {
      if (KS.history.canUndo()) await KS.autosave();
      try {
        const r = await KS.drafts.load(id);
        KS.home.hide();
        pl.pause(); pl.t = 0;
        this.afterProjectChange();
        $('projectName').value = KS.project.name;
        KS.timeline.fit();
        const miss = KS.mediaLib.missingNames();
        if (miss.length) { KS.select(null); KS.toast(`Find these files to bring them back: ${miss.join(', ')}.`, 7000); }
        else KS.toast(`Opened “${KS.project.name}”.`, 2000);
        if (KS.isPhoto()) KS.select(KS.project.clips[0].id);
      } catch (e) { KS.toast(e.message || 'That draft could not be opened.', 5000); }
    },

    /* Shows or hides the parts of the editor each kind of project uses. */
    syncMode() {
      const P = KS.project, photo = KS.isPhoto();
      document.body.dataset.mode = P.mode;
      $('btnExport').textContent = photo ? 'Save photo' : 'Export video';
      $('btnExport').title = photo ? 'Save the picture (Ctrl+E)' : 'Export video (Ctrl+E)';
      $('btnImport').textContent = P.mode === 'collage' ? 'Add photos' : P.mode === 'photo' ? 'Add picture' : 'Import media';
      $('btnImport').title = P.mode === 'collage' ? 'Add photos to the collage' : P.mode === 'photo' ? 'Put another picture on top of your photo' : 'Add videos, photos or music (Ctrl+I)';
      const menus = {
        video: [['clip', 'Video or photo clip (to the end)'], ['overlay', 'Overlay: picture-in-picture, logo'], ['sticker', 'Sticker or emoji'], ['music', 'Music or sound effect'], ['voice', 'Record a voiceover'], ['color', 'Colour clip (for titles and gaps)'], ['freeze', 'Freeze frame at the playhead'], ['bgimage', 'Background image']],
        photo: [['overlay', 'Picture on top (logo, photo, PNG)'], ['sticker', 'Sticker or emoji'], ['bgimage', 'Background image']],
        collage: [['collage', 'Photo to the collage'], ['overlay', 'Picture on top (logo, PNG)'], ['sticker', 'Sticker or emoji'], ['bgimage', 'Background image']],
      };
      const as = $('addSelect');
      as.innerHTML = '';
      as.append(new Option(photo ? '＋ Add picture, sticker…' : '＋ Add video, overlay, music…', ''));
      menus[P.mode].forEach(([v, l]) => as.append(new Option(l, v)));
      const ps = $('presetSelect');
      ps.innerHTML = '';
      ps.append(new Option('Text preset…', ''));
      PRESETS.filter(([k]) => !photo || PHOTO_PRESETS.has(k)).forEach(([k, l]) => ps.append(new Option(photo ? l.replace('Video frame (video around text)', 'Photo frame (photo around text)') : l, k)));
      if (photo) { pl.pause(); pl.t = 0; }
      R.transparent = photo; // see-through areas show as a checkerboard
      R.prepCache = {}; R.cutCache = {};
      KS.requestRender();
    },
    afterProjectChange() {
      const asp = KS.project.canvas.aspect;
      if (!KS.ASPECTS[asp] && asp !== 'source' && asp !== 'photo' && !KS.COLLAGE_ASPECTS[asp]) this.setAspect('16:9');
      this.syncMode();
      this.applyCanvasSize();
      KS.pool.gc();
      if (pl.t > pl.duration) pl.t = pl.duration;
      pl.sync(pl.playing);
      syncVolume(); syncDropHint();
    },

    /* ----- saving a photo ----- */
    photoDims(v) {
      const P = KS.project, w = P.canvas.w, h = P.canvas.h;
      let s = v[0] === 'x' ? Number(v.slice(1)) : Number(v.slice(1)) / Math.max(w, h);
      s = Math.min(s, KS.ai.MAX_OUTPUT / Math.max(w, h));
      return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), s];
    },
    openPhotoExport() {
      const P = KS.project, w = P.canvas.w, h = P.canvas.h;
      const ss = $('phSize');
      ss.innerHTML = '';
      const add = (v, label) => { const [W, H, s] = this.photoDims(v); ss.append(new Option(`${label}, ${W} × ${H}${s > 1.01 ? ' (upscaled)' : ''}`, v)); };
      add('x1', 'Original size');
      if (Math.max(w, h) * 2 <= KS.ai.MAX_OUTPUT) add('x2', '2× bigger');
      if (Math.max(w, h) * 4 <= KS.ai.MAX_OUTPUT) add('x4', '4× bigger');
      [[4096, '4K'], [2048, 'Large'], [1080, 'Social media (1080)']].forEach(([e, l]) => { if (Math.abs(e - Math.max(w, h)) > 8) add('e' + e, l); });
      const cut = P.clips.some((c) => (c.cutout.ai || c.chroma.enabled) && c.backdrop.type === 'none') || P.mode === 'collage';
      $('phTransparent').checked = P.background.type === 'none' && cut && P.mode !== 'collage';
      $('phAI').checked = true;
      $('photoDlg').dataset.state = 'idle';
      $('phBar').style.width = '0%';
      $('phStatus').textContent = '';
      $('phStart').disabled = false;
      $('photoDlg').showModal();
      this.refreshPhotoExport();
    },
    refreshPhotoExport() {
      const fmt = $('phFormat').value;
      const [W, H, s] = this.photoDims($('phSize').value);
      $('phTransRow').hidden = fmt === 'image/jpeg';
      $('phQualRow').hidden = fmt === 'image/png';
      const bigger = s > 1.05 && KS.exporter.upscaleJobs(W, H).length > 0;
      $('phAIRow').hidden = !bigger;
      $('phAIQRow').hidden = !bigger || !$('phAI').checked;
      $('phQualVal').textContent = $('phQuality').value + '%';
      const mp = (W * H) / 1e6;
      const est = fmt === 'image/png' ? mp * 2.6 : mp * (0.15 + Number($('phQuality').value) / 100 * 0.55);
      $('phEstimate').textContent = `${W} × ${H} pixels (${mp.toFixed(1)} megapixels), about ${est < 10 ? est.toFixed(1) : Math.round(est)} MB.` +
        (bigger ? ($('phAI').checked ? ' Photos are enlarged with AI; text and stickers are drawn sharp at full size.' : ' Photos are enlarged with smooth resizing.') : '');
    },
    async runPhotoExport() {
      const X = KS.exporter;
      const [W, H, s] = this.photoDims($('phSize').value);
      const type = $('phFormat').value;
      const dlg = $('photoDlg');
      dlg.dataset.state = 'running';
      $('phStart').disabled = true;
      $('phCancel').textContent = 'Stop';
      const progress = (p, msg) => { $('phBar').style.width = (KS.clamp(p, 0, 1) * 100).toFixed(1) + '%'; if (msg) $('phStatus').textContent = msg; };
      try {
        const res = await X.startPhoto({
          type, width: W, height: H, quality: Number($('phQuality').value) / 100,
          transparent: type !== 'image/jpeg' && $('phTransparent').checked,
          ai: s > 1.05 && $('phAI').checked, aiQuality: $('phAIQ').value,
        }, progress);
        if (!res) { dlg.dataset.state = 'idle'; $('phStatus').textContent = 'Stopped.'; return; }
        download(res.blob, res.filename);
        $('phBar').style.width = '100%';
        dlg.dataset.state = 'done';
        $('phStatus').textContent = `Saved ${res.filename} (${res.w} × ${res.h}, ${(res.blob.size / 1048576).toFixed(1)} MB).`;
      } catch (e) {
        console.error(e);
        dlg.dataset.state = 'error';
        $('phStatus').textContent = e.message || String(e);
      } finally {
        $('phStart').disabled = false;
        $('phCancel').textContent = 'Close';
      }
    },

    /* ----- export dialog ----- */
    exportDims(choice) {
      const P = KS.project;
      if (choice === 'project') return [P.canvas.w, P.canvas.h];
      const s = Number(choice) / Math.min(P.canvas.w, P.canvas.h);
      return [KS.even(P.canvas.w * s), KS.even(P.canvas.h * s)];
    },
    openExport() {
      if (KS.isPhoto()) { this.openPhotoExport(); return; }
      const X = KS.exporter;
      if (!X.supported() && typeof OfflineAudioContext === 'undefined') { KS.toast('Export needs a current version of Chrome, Edge or Firefox.', 6000); return; }
      const P = KS.project;
      const ms = $('exMode');
      ms.innerHTML = '';
      if (X.supportsHQ()) ms.append(new Option('High quality, frame by frame (recommended)', 'hq'));
      if (X.supportsRT()) ms.append(new Option('Real-time recording (plays through once)', 'rt'));
      if (typeof OfflineAudioContext !== 'undefined') ms.append(new Option('Sound only (WAV)', 'wav'));
      const rs = $('exRes');
      rs.innerHTML = '';
      const native = Math.min(P.canvas.w, P.canvas.h);
      rs.append(new Option(`Project size, ${P.canvas.w} × ${P.canvas.h}`, 'project'));
      [[2160, '4K Ultra HD'], [1440, '2K QHD'], [1080, 'Full HD'], [720, 'HD'], [480, 'SD']].forEach(([s, l]) => {
        if (s === native) return;
        const [w, h] = this.exportDims(s);
        rs.append(new Option(`${l}, ${w} × ${h}${s > native ? ' (upscaled)' : ''}`, s));
      });
      $('exFps').value = String(P.canvas.fps);
      $('exQuality').value = 'auto';
      const au = $('exAudio');
      au.disabled = !pl.hasSound;
      au.checked = pl.hasSound;
      $('exAudioNote').textContent = pl.hasSound ? '' : 'The project has no sound yet.';
      $('exToFileRow').hidden = !window.showSaveFilePicker;
      $('exToFile').checked = false;
      this.setExportState('idle');
      $('exportDlg').showModal();
      this.refreshExport();
    },
    async refreshExport() {
      const X = KS.exporter, P = KS.project;
      const mode = $('exMode').value;
      const dlg = $('exportDlg');
      dlg.dataset.mode = mode;
      const [w, h] = this.exportDims($('exRes').value);
      const fps = Number($('exFps').value);
      const q = $('exQuality').value;
      const bitrate = q === 'auto' ? X.autoBitrate(w, h, fps) : Number(q) * 1e6;
      const native = Math.min(P.canvas.w, P.canvas.h);
      if (!this._enhanceTouched) $('exEnhance').checked = Math.min(w, h) > native;
      const fs = $('exFormat');
      const prev = fs.value;
      if (mode === 'hq') {
        const token = (this._fmtToken = {});
        fs.innerHTML = '<option>Checking what this computer can encode…</option>';
        fs.disabled = true;
        const list = await X.hqFormats(w, h, fps, bitrate);
        if (token !== this._fmtToken) return;
        this._fmts = list;
        fs.innerHTML = '';
        list.forEach((f) => fs.append(new Option(f.label, f.id)));
        fs.disabled = dlg.dataset.state === 'running';
        if (list.find((f) => f.id === prev)) fs.value = prev;
        if (!list.length) fs.append(new Option(`No encoder for ${w} × ${h} here; try a smaller size`, ''));
      } else if (mode === 'rt') {
        this._fmts = X.rtFormats().map((f, i) => ({ ...f, id: 'rt' + i }));
        fs.innerHTML = '';
        this._fmts.forEach((f) => fs.append(new Option(f.label, f.id)));
        if (this._fmts.find((f) => f.id === prev)) fs.value = prev;
        fs.disabled = false;
      } else {
        this._fmts = [];
        fs.innerHTML = '<option>WAV, 48 kHz stereo</option>';
      }
      const D = pl.duration;
      const aKbps = Number($('exAudioQ').value);
      const mb = mode === 'wav' ? (D * 48000 * 4) / 1048576 : ((bitrate / 8) * D + ($('exAudio').checked ? (aKbps * 125) * D : 0)) / 1048576;
      const how = mode === 'hq' ? 'Each frame is rendered exactly, so nothing is dropped; this can take longer than the video itself.'
        : mode === 'rt' ? 'Plays through once in real time, so it takes about as long as the video. Keep the window visible.'
          : 'Exports the mixed soundtrack: clip sound, music, voiceovers and overlay sound.';
      $('exLen').textContent = `Length ${KS.fmtSec(D)}. ${how}`;
      $('exEstimate').textContent = `Output ${mode === 'wav' ? 'sound only' : `${w} × ${h} at ${fps} fps, ${(bitrate / 1e6).toFixed(bitrate < 1e7 ? 1 : 0)} Mbps`}. Estimated size about ${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB.`;
      if (window.showSaveFilePicker && mode === 'hq' && !this._toFileTouched) $('exToFile').checked = mb > 700;
    },
    setExportState(state, extra) {
      const dlg = $('exportDlg');
      dlg.dataset.state = state;
      $('exStart').disabled = state === 'running';
      $('exForm').querySelectorAll('select,input').forEach((x) => { if (x.id !== 'exAudio' || pl.hasSound) x.disabled = state === 'running'; });
      $('exCancel').textContent = state === 'running' ? 'Stop export' : 'Close';
      if (state === 'idle') { $('exBar').style.width = '0%'; $('exStatus').textContent = ''; $('exAgain').hidden = true; this._enhanceTouched = false; this._toFileTouched = false; }
      if (state === 'done') { $('exStatus').textContent = extra; $('exAgain').hidden = !this._lastExport || !this._lastExport.blob; }
      if (state === 'error') { $('exStatus').textContent = extra; }
    },
    async runExport() {
      const X = KS.exporter;
      const mode = $('exMode').value;
      const [w, h] = this.exportDims($('exRes').value);
      const fps = Number($('exFps').value);
      const q = $('exQuality').value;
      const bitrate = q === 'auto' ? X.autoBitrate(w, h, fps) : Number(q) * 1e6;
      const f = (this._fmts || []).find((x) => x.id === $('exFormat').value);
      if (mode !== 'wav' && !f) { this.setExportState('error', 'No export format is available for these settings. Try a smaller size or another mode.'); return; }
      let fileHandle = null;
      if (mode === 'hq' && $('exToFile').checked && window.showSaveFilePicker) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${safeName()}.${f.ext}`,
            types: [{ description: f.ext.toUpperCase() + ' video', accept: { [f.ext === 'mp4' ? 'video/mp4' : 'video/webm']: ['.' + f.ext] } }],
          });
        } catch (e) { return; } // cancelled
      }
      this.setExportState('running');
      const progress = (p, msg) => {
        $('exBar').style.width = (KS.clamp(p, 0, 1) * 100).toFixed(1) + '%';
        if (msg) $('exStatus').textContent = msg;
      };
      try {
        let res;
        const audio = $('exAudio').checked;
        if (mode === 'wav') res = await X.startWav(progress);
        else if (mode === 'rt') res = await X.start({ mime: f.mime, ext: f.ext, width: w, height: h, fps, bitrate, audio }, progress);
        else res = await X.startHQ({ format: f, width: w, height: h, fps, bitrate, audio, audioKbps: Number($('exAudioQ').value), enhance: $('exEnhance').checked, fileHandle }, progress);
        if (!res) { this.setExportState('idle'); KS.toast('Export stopped.'); return; }
        this._lastExport = res;
        $('exBar').style.width = '100%';
        if (res.savedToFile) { this.setExportState('done', `Saved ${res.filename}.`); return; }
        download(res.blob, res.filename);
        this.setExportState('done', `Exported ${res.filename} (${(res.blob.size / 1048576).toFixed(1)} MB).`);
      } catch (e) {
        console.error(e);
        this.setExportState('error', e.message || String(e));
      }
    },
  });

  /* ---------- layers panel ---------- */
  function renderLayers() {
    const P = KS.project, ul = $('layerList');
    ul.innerHTML = '';
    const groups = [];
    groups.push(['Text', [...P.texts].reverse().map((L) => ({
      id: L.id, name: L.name, sub: `${MODE_LABEL[L.mode]} · ${KS.ANIM_LABEL[L.anim.type] || 'Static'}`,
      icon: 'text', cls: 'is-text', toggles: true, obj: L,
    }))]);
    if (P.overlays.length) {
      groups.push([KS.isPhoto() ? 'Pictures and stickers' : 'Overlays', [...P.overlays].reverse().map((O) => ({
        id: O.id, name: O.name, sub: `${O.sticker ? 'Sticker' : O.kind === 'video' ? 'Video' : 'Picture'} · ${O.above ? 'above' : 'below'} text${O.chroma.enabled ? ' · keyed' : ''}${O.cutout.ai ? ' · cut-out' : ''}${O.upscaled > 1 ? ' · AI ' + O.upscaled + '×' : ''}`,
        icon: 'overlay', cls: 'is-overlay', toggles: true, obj: O,
      }))]);
    }
    if (P.audio.length) {
      groups.push(['Audio', P.audio.map((a) => ({
        id: a.id, name: a.name, sub: `${KS.fmtSec(a.start)} · ${KS.fmtSec(KS.mix.audioEnd(a) - a.start)}${a.loop ? ' · loop' : ''}${KS.mediaLib.get(a.mediaId) ? '' : ' · offline'}`,
        icon: 'music', cls: 'is-audio' + (a.muted ? ' is-hidden' : ''), mute: true, obj: a,
      }))]);
    }
    const bgNames = { color: 'Solid colour', gradient: 'Gradient', image: 'Image', 'video-blur': 'Blurred video', none: 'No background' };
    groups.push([null, [{ id: 'background', name: 'Background', sub: bgNames[P.background.type], icon: 'bg' }]]);
    const lay = KS.seq.layout();
    const photo = KS.isPhoto();
    const tags = (c) => `${c.upscaled > 1 ? ' · AI ' + c.upscaled + '×' : ''}${c.cutout.ai ? ' · cut-out' : ''}${c.crop ? ' · cropped' : ''}${c.reverse ? ' · reversed' : ''}`;
    groups.push([photo ? (P.mode === 'photo' ? 'Photo' : 'Collage photos') : 'Video track', lay.map((e) => ({
      id: e.clip.id, name: P.mode === 'photo' ? e.clip.name : `${e.index + 1}. ${e.clip.name}`,
      sub: photo ? `${e.clip.srcW} × ${e.clip.srcH}${tags(e.clip)}`
        : `${{ video: 'Video', image: 'Photo', demo: 'Demo', color: 'Colour' }[e.clip.kind]} · ${KS.fmtSec(e.len)}${e.tin ? ' · transition' : ''}${tags(e.clip)}${e.clip.kind === 'video' && !KS.mediaLib.get(e.clip.mediaId) ? ' · offline' : ''}`,
      icon: photo ? 'bg' : 'film', cls: 'is-clip',
    }))]);

    for (const [title, items] of groups) {
      if (!items.length) continue;
      if (title) {
        const h = document.createElement('li');
        h.className = 'layer-group';
        h.textContent = title;
        ul.append(h);
      }
      for (const it of items) {
        const li = document.createElement('li');
        const hidden = it.obj && it.toggles && it.obj.visible === false;
        li.className = 'layer-item ' + (it.cls || '') + (KS.ui.selected === it.id ? ' is-selected' : '') + (hidden ? ' is-hidden' : '');
        const main = document.createElement('button');
        main.type = 'button';
        main.className = 'layer-main';
        main.innerHTML = `<span class="layer-icon">${ICON[it.icon]}</span><span class="layer-text"><span class="layer-name"></span><span class="layer-sub"></span></span>`;
        main.querySelector('.layer-name').textContent = it.name;
        main.querySelector('.layer-sub').textContent = it.sub;
        main.addEventListener('click', () => { KS.select(it.id); if (it.cls === 'is-clip') { const e = KS.seq.layout().find((x) => x.clip.id === it.id); if (e && (pl.t < e.start || pl.t >= e.end)) pl.seek(e.start); } });
        main.addEventListener('dblclick', () => { if (it.icon === 'text') KS.emit('focus-text'); });
        li.append(main);
        if (it.toggles) {
          const L = it.obj;
          const vis = document.createElement('button');
          vis.type = 'button'; vis.className = 'icon-btn';
          vis.title = L.visible ? 'Hide layer' : 'Show layer';
          vis.setAttribute('aria-label', vis.title + ' ' + L.name);
          vis.innerHTML = L.visible ? ICON.eye : ICON.eyeOff;
          vis.addEventListener('click', () => { L.visible = !L.visible; KS.commit(); KS.emit('layers'); KS.requestRender(); pl.sync(pl.playing); });
          const lock = document.createElement('button');
          lock.type = 'button'; lock.className = 'icon-btn' + (L.locked ? ' on' : '');
          lock.title = L.locked ? 'Unlock layer' : 'Lock layer';
          lock.setAttribute('aria-label', lock.title + ' ' + L.name);
          lock.innerHTML = L.locked ? ICON.lock : ICON.unlock;
          lock.addEventListener('click', () => { L.locked = !L.locked; KS.commit(); KS.emit('layers'); });
          li.append(vis, lock);
        }
        if (it.mute) {
          const a = it.obj;
          const mb = document.createElement('button');
          mb.type = 'button'; mb.className = 'icon-btn' + (a.muted ? ' on' : '');
          mb.title = a.muted ? 'Unmute track' : 'Mute track';
          mb.setAttribute('aria-label', mb.title + ' ' + a.name);
          mb.innerHTML = a.muted ? ICON.muted : ICON.sound;
          mb.addEventListener('click', () => { a.muted = !a.muted; KS.commit(); KS.emit('layers'); pl.sync(pl.playing); KS.emit('refresh-inspector'); });
          li.append(mb);
        }
        ul.append(li);
      }
    }
    const f = KS.selectedItem();
    const type = f ? f.type : null;
    const editable = ['text', 'clip', 'overlay', 'audio'].includes(type);
    $('btnDup').disabled = !editable;
    $('btnDel').disabled = !editable;
    $('btnSplit').disabled = !editable || KS.isPhoto();
    const movable = ['text', 'clip', 'overlay'].includes(type) && !(type === 'clip' && P.mode === 'photo');
    $('btnUp').disabled = !movable;
    $('btnDown').disabled = !movable;
    $('btnDup').disabled = !editable || (type === 'clip' && P.mode === 'photo');
    const clip = type === 'clip';
    $('btnUp').title = clip ? (P.mode === 'collage' ? 'Move to the next cell' : 'Move later on the video track') : 'Bring forward';
    $('btnDown').title = clip ? (P.mode === 'collage' ? 'Move to the previous cell' : 'Move earlier on the video track') : 'Send backward';
  }

  /* ---------- stage interaction ---------- */
  const ov = $('overlay'), octx = ov.getContext('2d');
  let drag = null;

  function toCanvas(e) {
    const r = ov.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * R.cv.width, y: ((e.clientY - r.top) / r.height) * R.cv.height };
  }
  function boxFor(L) {
    const b = R.boxes[L.id];
    if (!b) return null;
    const a = b.anim && !b.anim.special ? b.anim : null;
    return { cx: a ? a.cx : b.cx, cy: a ? a.cy : b.cy, w: b.w * (a ? a.s : 1), h: b.h * (a ? a.s : 1), rot: b.rot + (a ? a.rot : 0), live: !!b.anim };
  }
  /* Things on the stage, top-most first: overlays above text, text, overlays below text. */
  function stageItems() {
    const P = KS.project;
    return [
      ...[...P.overlays].reverse().filter((O) => O.above),
      ...[...P.texts].reverse(),
      ...[...P.overlays].reverse().filter((O) => !O.above),
    ];
  }
  function hitTest(p) {
    const pad = 10 * (R.cv.width / ov.getBoundingClientRect().width || 1);
    for (const L of stageItems()) {
      if (!L.visible) continue;
      const b = boxFor(L);
      if (!b || (!b.live && KS.ui.selected !== L.id)) continue;
      const dx = p.x - b.cx, dy = p.y - b.cy, c = Math.cos(-b.rot), s = Math.sin(-b.rot);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      if (Math.abs(lx) <= b.w / 2 + pad && Math.abs(ly) <= b.h / 2 + pad) return L;
    }
    return null;
  }
  function selectedStageItem() {
    const f = KS.selectedItem();
    return f && (f.type === 'text' || f.type === 'overlay') ? f.obj : null;
  }
  function drawOverlay() {
    const c = octx, W = ov.width, H = ov.height;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    const s = W / R.cv.width;
    const dpr = window.devicePixelRatio || 1;
    const accent = '#f44336';
    if (KS.ui.guides) {
      c.strokeStyle = 'rgba(255,255,255,0.28)';
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      for (const f of [1 / 3, 2 / 3]) {
        c.beginPath(); c.moveTo(W * f, 0); c.lineTo(W * f, H); c.stroke();
        c.beginPath(); c.moveTo(0, H * f); c.lineTo(W, H * f); c.stroke();
      }
      c.setLineDash([]);
      c.strokeStyle = 'rgba(255,255,255,0.4)';
      c.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9);
      c.strokeStyle = 'rgba(255,255,255,0.22)';
      c.strokeRect(W * 0.1, H * 0.1, W * 0.8, H * 0.8);
    }
    const L = selectedStageItem();
    const b = L && boxFor(L);
    if (b && !(KS.exporter.active)) {
      c.save();
      c.translate(b.cx * s, b.cy * s);
      c.rotate(b.rot);
      const w = b.w * s + 12 * dpr, h = b.h * s + 12 * dpr;
      c.strokeStyle = b.live ? accent : 'rgba(255,255,255,0.45)';
      c.lineWidth = 1.5 * dpr;
      c.setLineDash(b.live ? [] : [5 * dpr, 4 * dpr]);
      c.strokeRect(-w / 2, -h / 2, w, h);
      if (b.live && !L.locked) {
        c.fillStyle = accent;
        const hs = 6 * dpr;
        for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) c.fillRect(x - hs / 2, y - hs / 2, hs, hs);
      }
      c.restore();
    }
    // the selected collage photo
    const sel = KS.selectedItem();
    if (sel && sel.type === 'clip' && KS.project.mode === 'collage' && R.cellBoxes[sel.obj.id]) {
      const r = R.cellBoxes[sel.obj.id];
      c.strokeStyle = accent; c.lineWidth = 2 * dpr; c.setLineDash([]);
      c.strokeRect(r.x * s + dpr, r.y * s + dpr, r.w * s - 2 * dpr, r.h * s - 2 * dpr);
    }
    if (drag && (drag.snapX || drag.snapY)) {
      c.strokeStyle = '#8bc34a';
      c.lineWidth = 1 * dpr;
      if (drag.snapX) { c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); }
      if (drag.snapY) { c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke(); }
    }
  }

  /* Photo projects: the photo (or collage cell) under the pointer. */
  function cellAt(p) {
    const P = KS.project;
    if (P.mode === 'photo') return { clip: P.clips[0], r: { x: 0, y: 0, w: R.cv.width, h: R.cv.height } };
    if (P.mode !== 'collage') return null;
    for (const c of P.clips) {
      const r = R.cellBoxes[c.id];
      if (r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return { clip: c, r };
    }
    return null;
  }
  ov.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const L = hitTest(p);
    if (!L) {
      const cell = cellAt(p);
      if (!cell) { KS.select(null); return; }
      KS.select(cell.clip.id);
      drag = { cell: true, id: cell.clip.id, p0: p, x0: cell.clip.offsetX, y0: cell.clip.offsetY, r: cell.r, moved: false };
      ov.setPointerCapture(e.pointerId);
      ov.classList.add('is-dragging');
      return;
    }
    KS.select(L.id);
    if (L.locked) { KS.toast('This layer is locked. Unlock it in the layers panel to move it.'); return; }
    drag = { id: L.id, p0: p, x0: L.x, y0: L.y, moved: false, snapX: false, snapY: false };
    ov.setPointerCapture(e.pointerId);
    ov.classList.add('is-dragging');
  });
  ov.addEventListener('pointermove', (e) => {
    const p = toCanvas(e);
    if (!drag) { ov.style.cursor = hitTest(p) || (KS.project.mode === 'collage' && cellAt(p)) ? 'move' : 'default'; return; }
    const f = KS.find(drag.id);
    const L = f && f.obj;
    if (!L) return;
    if (drag.cell) {
      // move the photo inside its cell (only visible once it's zoomed in, or with Fit)
      const dx = (p.x - drag.p0.x) / drag.r.w, dy = (p.y - drag.p0.y) / drag.r.h;
      if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
      L.offsetX = Math.round(KS.clamp(drag.x0 + dx, -1, 1) * 10000) / 10000;
      L.offsetY = Math.round(KS.clamp(drag.y0 + dy, -1, 1) * 10000) / 10000;
      KS.requestRender();
      return;
    }
    const W = R.cv.width, H = R.cv.height;
    let nx = drag.x0 + (p.x - drag.p0.x) / W;
    let ny = drag.y0 + (p.y - drag.p0.y) / H;
    if (Math.abs(p.x - drag.p0.x) + Math.abs(p.y - drag.p0.y) > 2) drag.moved = true;
    const th = 10 * (W / ov.getBoundingClientRect().width);
    drag.snapX = !e.altKey && Math.abs(nx - 0.5) * W < th;
    drag.snapY = !e.altKey && Math.abs(ny - 0.5) * H < th;
    if (drag.snapX) nx = 0.5;
    if (drag.snapY) ny = 0.5;
    L.x = Math.round(nx * 10000) / 10000;
    L.y = Math.round(ny * 10000) / 10000;
    KS.requestRender();
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    ov.classList.remove('is-dragging');
    KS.requestRender();
    if (moved) { KS.commit(); KS.emit('refresh-inspector'); }
  };
  ov.addEventListener('pointerup', endDrag);
  ov.addEventListener('pointercancel', endDrag);
  ov.addEventListener('dblclick', (e) => { const L = hitTest(toCanvas(e)); if (L && KS.getText(L.id)) KS.emit('focus-text'); });
  // mouse wheel over the selected overlay resizes it
  let wheelCommit = null;
  ov.addEventListener('wheel', (e) => {
    const f = KS.selectedItem();
    if (f && f.type === 'clip' && KS.isPhoto()) {
      const cell = cellAt(toCanvas(e));
      if (!cell || cell.clip !== f.obj) return;
      e.preventDefault();
      f.obj.zoom = KS.clamp(f.obj.zoom * (e.deltaY < 0 ? 1.05 : 1 / 1.05), 0.2, 6);
      KS.requestRender();
      clearTimeout(wheelCommit);
      wheelCommit = setTimeout(() => { KS.commit(); KS.emit('refresh-inspector'); }, 300);
      return;
    }
    if (!f || f.type !== 'overlay' || f.obj.locked) return;
    const L = hitTest(toCanvas(e));
    if (!L || L.id !== f.obj.id) return;
    e.preventDefault();
    f.obj.width = KS.clamp(f.obj.width * (e.deltaY < 0 ? 1.05 : 1 / 1.05), 0.02, 2);
    KS.requestRender();
    clearTimeout(wheelCommit);
    wheelCommit = setTimeout(() => { KS.commit(); KS.emit('refresh-inspector'); }, 300);
  }, { passive: false });

  /* drag and drop files: videos → video track, sound → audio track, images → background
     (hold Shift for an overlay, Ctrl for a photo clip), .json → open project */
  const stageWrap = $('stageWrap');
  stageWrap.addEventListener('dragover', (e) => { e.preventDefault(); stageWrap.classList.add('is-drop'); });
  stageWrap.addEventListener('dragleave', (e) => { if (e.target === stageWrap || !stageWrap.contains(e.relatedTarget)) stageWrap.classList.remove('is-drop'); });
  stageWrap.addEventListener('drop', async (e) => {
    e.preventDefault();
    stageWrap.classList.remove('is-drop');
    const files = [...(e.dataTransfer.files || [])];
    if (KS.ui.home) return;
    for (const f of files) {
      const kind = KS.mediaKind(f);
      if (kind === 'project') { await app.openProject(f); continue; }
      if (KS.isPhoto()) { await app.importMedia(f); continue; }
      if (kind === 'image' && e.shiftKey) await app.addOverlayFile(f);
      else if (kind === 'image' && (e.ctrlKey || e.metaKey)) await app.importMedia(f);
      else if (kind === 'image') await app.setBackgroundImage(f);
      else await app.importMedia(f);
    }
  });

  /* ---------- transport ---------- */
  let lastTC = '';
  function updateTransport() {
    const fps = KS.project.canvas.fps;
    const tc = `${KS.fmtTime(pl.t, fps)} / ${KS.fmtTime(pl.duration, fps)}`;
    if (tc !== lastTC) { $('timecode').textContent = tc; lastTC = tc; }
  }
  function syncPlayButton() {
    $('btnPlay').innerHTML = pl.playing ? ICON.pause : ICON.play;
    $('btnPlay').setAttribute('aria-label', pl.playing ? 'Pause' : 'Play');
    $('btnPlay').title = pl.playing ? 'Pause (Space)' : 'Play (Space)';
  }
  function syncVolume() {
    const M = KS.project.master;
    $('volume').value = Math.round(M.volume * 100);
    $('btnMute').classList.toggle('on', M.muted);
    $('btnMute').setAttribute('aria-pressed', M.muted ? 'true' : 'false');
  }
  function syncToggles() {
    $('btnLoop').setAttribute('aria-pressed', KS.ui.loop ? 'true' : 'false');
    $('btnGuides').setAttribute('aria-pressed', KS.ui.guides ? 'true' : 'false');
  }
  function syncUndo() {
    $('btnUndo').disabled = !KS.history.canUndo();
    $('btnRedo').disabled = !KS.history.canRedo();
  }
  function syncDropHint() {
    const C = KS.project.clips;
    $('dropHint').hidden = !(C.length === 1 && C[0].kind === 'demo');
  }
  function syncRec() {
    const on = KS.recorder.active;
    $('btnRec').classList.toggle('on', on);
    $('btnRec').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('btnRec').title = on ? 'Stop recording (R)' : 'Record a voiceover from the playhead (R)';
  }

  function bindUI() {
    $('btnPlay').addEventListener('click', () => pl.toggle());
    $('btnStart').addEventListener('click', () => { pl.pause(); pl.seek(0); });
    $('btnEnd').addEventListener('click', () => { pl.pause(); pl.seek(pl.duration); });
    $('btnPrev').addEventListener('click', () => pl.step(-1));
    $('btnNext').addEventListener('click', () => pl.step(1));
    $('btnLoop').addEventListener('click', () => { KS.ui.loop = !KS.ui.loop; syncToggles(); });
    $('btnGuides').addEventListener('click', () => { KS.ui.guides = !KS.ui.guides; syncToggles(); KS.requestRender(); });
    $('btnRec').addEventListener('click', () => app.toggleRecord());
    $('btnFull').addEventListener('click', () => {
      const st = $('stage');
      if (document.fullscreenElement) document.exitFullscreen();
      else if (st.requestFullscreen) st.requestFullscreen().catch(() => KS.toast('Full screen isn’t available here.'));
    });
    document.addEventListener('fullscreenchange', () => setTimeout(() => app.layoutStage(), 50));
    $('volume').addEventListener('input', (e) => { KS.project.master.volume = Number(e.target.value) / 100; pl.sync(pl.playing); });
    $('volume').addEventListener('change', () => { KS.commit(); KS.emit('refresh-inspector'); });
    $('btnMute').addEventListener('click', () => { const M = KS.project.master; M.muted = !M.muted; pl.sync(pl.playing); syncVolume(); KS.commit(); KS.emit('refresh-inspector'); });

    const onFiles = (id, fn) => $(id).addEventListener('change', (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) fn(fs); });
    $('btnImport').addEventListener('click', () => (KS.project.mode === 'photo' ? app.pickOverlay() : app.pickMedia()));
    $('dropImport').addEventListener('click', () => app.pickMedia());
    onFiles('fileMedia', (fs) => app.importFiles(fs));
    onFiles('fileAudio', async (fs) => { for (const f of fs) await app.addAudioFile(f); });
    onFiles('fileOverlay', (fs) => app.addOverlayFile(fs[0], app._overlayTarget));
    onFiles('fileClip', (fs) => app.replaceClipMedia(app._replaceTarget, fs[0]));
    onFiles('fileRelink', (fs) => app.relinkFiles(fs));
    onFiles('fileImage', (fs) => app.setBackgroundImage(fs[0]));
    onFiles('fileFont', (fs) => app.loadFont(fs[0]));
    onFiles('fileProject', (fs) => app.openProject(fs[0]));
    $('btnUndo').addEventListener('click', () => KS.history.undo());
    $('btnRedo').addEventListener('click', () => KS.history.redo());
    $('btnSnapshot').addEventListener('click', () => app.snapshot());
    $('btnSave').addEventListener('click', () => app.saveProject());
    $('btnOpen').addEventListener('click', () => $('fileProject').click());
    $('btnNew').addEventListener('click', () => app.newProject());
    $('btnExport').addEventListener('click', () => app.openExport());
    $('btnHelp').addEventListener('click', () => $('helpDlg').showModal());
    $('helpClose').addEventListener('click', () => $('helpDlg').close());

    const pn = $('projectName');
    pn.addEventListener('change', () => { KS.project.name = pn.value.trim() || 'Untitled project'; pn.value = KS.project.name; KS.commit(); });

    $('btnAddText').addEventListener('click', () => app.addText());
    const ps = $('presetSelect');
    PRESETS.forEach(([k, l]) => ps.append(new Option(l, k)));
    ps.addEventListener('change', () => { if (ps.value) app.addPreset(ps.value); ps.value = ''; });
    const as = $('addSelect');
    as.addEventListener('change', () => {
      const v = as.value; as.value = '';
      if (v === 'clip') app.pickMedia();
      else if (v === 'overlay') app.pickOverlay();
      else if (v === 'music') app.pickAudio();
      else if (v === 'voice') app.toggleRecord();
      else if (v === 'color') app.addColorClip();
      else if (v === 'freeze') app.freezeFrame();
      else if (v === 'bgimage') app.pickBackgroundImage();
      else if (v === 'sticker') KS.tools.stickers();
      else if (v === 'collage') app.pickMedia();
    });
    // start screen and photo saving
    $('btnHome').addEventListener('click', () => app.goHome());
    $('phStart').addEventListener('click', () => app.runPhotoExport());
    $('phCancel').addEventListener('click', () => { if (KS.exporter.active) KS.exporter.cancel(); else $('photoDlg').close(); });
    $('photoDlg').addEventListener('cancel', (e) => { if (KS.exporter.active) e.preventDefault(); });
    ['phFormat', 'phSize', 'phAI', 'phAIQ', 'phQuality', 'phTransparent'].forEach((id) => $(id).addEventListener('input', () => app.refreshPhotoExport()));
    $('btnDup').addEventListener('click', () => app.duplicate());
    $('btnUp').addEventListener('click', () => app.move(1));
    $('btnDown').addEventListener('click', () => app.move(-1));
    $('btnDel').addEventListener('click', () => app.removeSelected());
    $('btnSplit').addEventListener('click', () => app.split());

    // export dialog
    $('exStart').addEventListener('click', () => app.runExport());
    $('exCancel').addEventListener('click', () => { if (KS.exporter.active) KS.exporter.cancel(); else $('exportDlg').close(); });
    $('exAgain').addEventListener('click', () => { const r = app._lastExport; if (r && r.blob) download(r.blob, r.filename); });
    $('exportDlg').addEventListener('cancel', (e) => { if (KS.exporter.active) e.preventDefault(); });
    ['exMode', 'exRes', 'exFps', 'exQuality', 'exAudio', 'exAudioQ'].forEach((id) => $(id).addEventListener('change', () => app.refreshExport()));
    $('exEnhance').addEventListener('change', () => { app._enhanceTouched = true; });
    $('exToFile').addEventListener('change', () => { app._toFileTouched = true; });

    // timeline height splitter
    const split = $('tlResize');
    split.addEventListener('pointerdown', (e) => {
      split.setPointerCapture(e.pointerId);
      const y0 = e.clientY, h0 = $('timeline').getBoundingClientRect().height;
      const move = (ev) => {
        const h = KS.clamp(h0 - (ev.clientY - y0), 140, window.innerHeight * 0.7);
        document.body.style.setProperty('--tl-h', h + 'px');
      };
      const up = () => { split.removeEventListener('pointermove', move); split.removeEventListener('pointerup', up); KS.timeline.drawRuler(); };
      split.addEventListener('pointermove', move);
      split.addEventListener('pointerup', up);
    });

    // shortcuts
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('dialog[open]') || KS.ui.home) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key;
      if (mod && k.toLowerCase() === 's') { e.preventDefault(); app.saveProject(); return; }
      if (mod && k.toLowerCase() === 'e') { e.preventDefault(); app.openExport(); return; }
      if (mod && k.toLowerCase() === 'o') { e.preventDefault(); $('fileProject').click(); return; }
      if (mod && k.toLowerCase() === 'i') { e.preventDefault(); app.pickMedia(); return; }
      if (isTyping(e.target)) { if (k === 'Escape') e.target.blur(); return; }
      if (mod && k.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) KS.history.redo(); else KS.history.undo(); return; }
      if (mod && k.toLowerCase() === 'y') { e.preventDefault(); KS.history.redo(); return; }
      if (mod && k.toLowerCase() === 'd') { e.preventDefault(); app.duplicate(); return; }
      if (mod) return;
      const tag = e.target && e.target.tagName;
      switch (k) {
        case ' ':
          if (tag === 'BUTTON' || tag === 'SELECT' || KS.isPhoto()) return;
          e.preventDefault(); pl.toggle(); break;
        case 'ArrowLeft': if (tag === 'INPUT' || tag === 'SELECT') return; e.preventDefault(); if (e.shiftKey) { pl.pause(); pl.seek(pl.t - 1); } else pl.step(-1); break;
        case 'ArrowRight': if (tag === 'INPUT' || tag === 'SELECT') return; e.preventDefault(); if (e.shiftKey) { pl.pause(); pl.seek(pl.t + 1); } else pl.step(1); break;
        case 'Home': e.preventDefault(); pl.pause(); pl.seek(0); break;
        case 'End': e.preventDefault(); pl.pause(); pl.seek(pl.duration); break;
        case 'Delete': case 'Backspace': if (KS.selectedItem() && KS.ui.selected !== 'background') { e.preventDefault(); app.removeSelected(); } break;
        case 't': case 'T': app.addText(); break;
        case 's': case 'S': app.split(); break;
        case 'i': case 'I': app.setIn(); break;
        case 'o': case 'O': app.setOut(); break;
        case 'r': case 'R': if (!KS.isPhoto()) app.toggleRecord(); break;
        case 'c': case 'C': { const f = KS.selectedItem(); if (f && f.type === 'clip') KS.tools.crop(f.obj); break; }
        case 'l': case 'L': KS.ui.loop = !KS.ui.loop; syncToggles(); KS.toast(KS.ui.loop ? 'Loop playback on.' : 'Loop playback off.', 1500); break;
        case 'g': case 'G': KS.ui.guides = !KS.ui.guides; syncToggles(); KS.requestRender(); break;
        case 'f': case 'F': $('btnFull').click(); break;
        case 'm': case 'M': $('btnMute').click(); break;
        case '?': $('helpDlg').showModal(); break;
        case 'Escape': KS.select(null); break;
        default: break;
      }
    });
  }

  /* ---------- events ---------- */
  KS.on('select', renderLayers);
  KS.on('layers', renderLayers);
  KS.on('project', () => { renderLayers(); app.afterProjectChange(); $('projectName').value = KS.project.name; });
  KS.on('source', () => { renderLayers(); syncVolume(); syncDropHint(); });
  KS.on('play-state', syncPlayButton);
  KS.on('history', () => { syncUndo(); syncDropHint(); });
  KS.on('duration', () => { renderLayers(); if (pl.t > pl.duration) pl.seek(pl.duration); else pl.sync(pl.playing); syncDropHint(); });
  KS.on('ended', () => { if (KS.recorder.active) KS.recorder.stop(); });

  /* ---------- main loop ---------- */
  function loop(now) {
    pl.tick(now);
    if (!KS.exporter.hq && (KS.dirty || pl.playing || KS.exporter.active)) {
      KS.dirty = false;
      R.render(pl.t);
      drawOverlay();
    }
    KS.exporter.tick();
    updateTransport();
    requestAnimationFrame(loop);
  }

  async function init() {
    R.init($('out'));
    pl.init();
    KS.timeline.init();
    KS.inspector.init();
    bindUI();
    KS.history.reset();
    await KS.drafts.init().catch(() => {});
    new ResizeObserver(() => app.layoutStage()).observe($('stage'));
    app.applyCanvasSize();
    renderLayers();
    KS.inspector.build();
    KS.timeline.build();
    KS.timeline.fit();
    KS.timeline.thumbs();
    $('projectName').value = KS.project.name;
    syncPlayButton(); syncVolume(); syncToggles(); syncUndo(); syncDropHint(); syncRec();
    app.syncMode();
    // Park the playhead where the title is fully visible, so the first view isn't an empty frame.
    pl.seek(Math.min(2, pl.duration));
    // like a phone editor, start by asking what to make (add #editor to the address to skip it)
    if (location.hash !== '#editor') KS.home.show();
    if (document.fonts) document.fonts.ready.then(() => KS.requestRender());
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
