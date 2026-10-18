/* AK Knockout Studio — inspector (properties panel) */
(function () {
  'use strict';
  const KS = window.KS;

  /* ---------- tiny DOM + form builder ---------- */
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  }
  const round = (v, step) => {
    const d = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number(Number(v).toFixed(d));
  };
  const changed = () => KS.requestRender();

  function section(parent, title, open = true) {
    const d = el('details', { class: 'sec', open });
    d.append(el('summary', {}, title));
    const body = el('div', { class: 'sec-body' });
    d.append(body);
    parent.append(d);
    return body;
  }
  function row(parent, label, control, forId, cls = '') {
    const r = el('div', { class: 'row ' + cls }, el('label', { for: forId, class: 'row-label' }, label), control);
    parent.append(r);
    return r;
  }
  function hint(parent, text) { parent.append(el('p', { class: 'hint' }, text)); }

  function range(parent, label, obj, key, o = {}) {
    const { min = 0, max = 100, step = 1, unit = '', scale = 1, onInput, onCommit } = o;
    const id = 'f' + KS.uid();
    const r = el('input', { type: 'range', id, min, max, step, value: obj[key] * scale });
    const n = el('input', { type: 'number', step, value: round(obj[key] * scale, step), 'aria-label': label + ' value' });
    const set = (v, commit) => {
      v = parseFloat(v);
      if (Number.isNaN(v)) return;
      obj[key] = v / scale;
      r.value = v;
      n.value = round(v, step);
      if (onInput) onInput(obj[key]);
      changed();
      if (commit) { KS.commit(); if (onCommit) onCommit(obj[key]); }
    };
    r.addEventListener('input', () => set(r.value, false));
    r.addEventListener('change', () => set(r.value, true));
    n.addEventListener('change', () => set(n.value, true));
    const wrap = el('div', { class: 'ctl-range' }, r, n);
    if (unit) wrap.append(el('span', { class: 'unit' }, unit));
    return row(parent, label, wrap, id);
  }
  function color(parent, label, obj, key, onCommit) {
    const id = 'f' + KS.uid();
    const c = el('input', { type: 'color', id, value: obj[key] });
    const tx = el('input', { type: 'text', value: obj[key], class: 'hex', maxlength: 7, 'aria-label': label + ' hex' });
    c.addEventListener('input', () => { obj[key] = c.value; tx.value = c.value; changed(); });
    c.addEventListener('change', () => { KS.commit(); if (onCommit) onCommit(); });
    tx.addEventListener('change', () => {
      if (/^#[0-9a-f]{6}$/i.test(tx.value)) { obj[key] = tx.value; c.value = tx.value; changed(); KS.commit(); if (onCommit) onCommit(); }
      else tx.value = obj[key];
    });
    return row(parent, label, el('div', { class: 'ctl-color' }, c, tx), id);
  }
  function select(parent, label, obj, key, options, onChange) {
    const id = 'f' + KS.uid();
    const s = el('select', { id });
    const add = (target, [v, l]) => target.append(el('option', { value: v, selected: String(obj[key]) === String(v) }, l));
    options.forEach((o) => {
      if (o.group) { const g = el('optgroup', { label: o.group }); o.items.forEach((it) => add(g, it)); s.append(g); }
      else add(s, o);
    });
    s.addEventListener('change', () => {
      const raw = s.value;
      obj[key] = typeof obj[key] === 'number' ? Number(raw) : raw;
      changed();
      if (onChange) onChange(obj[key]);
      KS.commit();
    });
    return row(parent, label, s, id);
  }
  function seg(parent, label, obj, key, options, onChange) {
    const wrap = el('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
    options.forEach(([v, l, title]) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': obj[key] === v ? 'true' : 'false', title: title || l, class: obj[key] === v ? 'on' : '' }, l);
      b.addEventListener('click', () => {
        obj[key] = v;
        wrap.querySelectorAll('button').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-checked', 'true');
        changed(); KS.commit();
        if (onChange) onChange(v);
      });
      wrap.append(b);
    });
    return row(parent, label, wrap, null, 'row-seg');
  }
  function check(parent, label, obj, key, onChange) {
    const id = 'f' + KS.uid();
    const c = el('input', { type: 'checkbox', id, checked: !!obj[key] });
    c.addEventListener('change', () => { obj[key] = c.checked; changed(); KS.commit(); if (onChange) onChange(c.checked); });
    const r = el('div', { class: 'row row-check' }, c, el('label', { for: id }, label));
    parent.append(r);
    return r;
  }
  function buttons(parent, list) {
    const w = el('div', { class: 'btn-row' });
    list.forEach(([label, fn, cls]) => w.append(el('button', { type: 'button', class: 'btn small ' + (cls || ''), onclick: fn }, label)));
    parent.append(w);
    return w;
  }

  /* ---------- looks (one-tap filter presets) ---------- */
  KS.LOOKS = [
    ['none', 'Original', {}],
    ['vivid', 'Vivid', { contrast: 110, saturate: 145 }],
    ['punch', 'Punchy', { contrast: 128, saturate: 130, sharpen: 30 }],
    ['warm', 'Warm', { temperature: 38, saturate: 110 }],
    ['cool', 'Cool', { temperature: -38, contrast: 106 }],
    ['sunset', 'Golden hour', { temperature: 50, saturate: 125, hue: -6, contrast: 105 }],
    ['cinematic', 'Cinematic', { contrast: 120, saturate: 88, temperature: -14, vignette: 34 }],
    ['dreamy', 'Dreamy', { brightness: 110, contrast: 86, saturate: 115, temperature: 12 }],
    ['faded', 'Faded', { brightness: 110, contrast: 80, saturate: 72 }],
    ['vintage', 'Vintage', { sepia: 45, contrast: 90, saturate: 80, brightness: 105, vignette: 36, grain: 30, temperature: 14 }],
    ['mono', 'Black & white', { grayscale: 100, contrast: 112 }],
    ['noir', 'Noir', { grayscale: 100, contrast: 150, brightness: 94, vignette: 48, grain: 22 }],
  ];
  const OVERLAY_ANIMS = new Set(['none', 'scroll-up', 'scroll-down', 'scroll-left', 'scroll-right', 'scroll-diag-up', 'scroll-diag-down',
    'ping-pong', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom-in', 'zoom-out', 'bounce', 'wipe', 'pulse', 'float', 'spin', 'shake']);

  /* ---------- inspector ---------- */
  const I = (KS.inspector = {
    init() {
      this.el = document.getElementById('inspector');
      this.title = document.getElementById('inspTitle');
      KS.on('select', () => this.build());
      KS.on('project', () => this.build());
      KS.on('source', () => this.build());
      KS.on('refresh-inspector', () => this.build());
      KS.on('focus-text', () => {
        const ta = this.el.querySelector('textarea');
        if (ta) { ta.focus(); ta.select(); }
      });
      KS.on('focus-section', (name) => {
        setTimeout(() => {
          const d = [...this.el.querySelectorAll('details.sec')].find((x) => x.querySelector('summary').textContent === name);
          if (d) { d.open = true; d.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
        }, 0);
      });
    },

    build() {
      const keepScroll = this.el.scrollTop;
      const openState = {};
      this.el.querySelectorAll('details.sec').forEach((d) => { openState[d.querySelector('summary').textContent] = d.open; });
      this.el.innerHTML = '';
      const f = KS.selectedItem();
      if (!f) { this.title.textContent = 'Project'; this.buildProject(); }
      else if (f.type === 'background') { this.title.textContent = 'Background'; this.buildBackground(); }
      else if (f.type === 'text') { this.title.textContent = f.obj.name; this.buildText(f.obj); }
      else if (f.type === 'clip') {
        const mode = KS.project.mode, n = KS.project.clips.indexOf(f.obj) + 1;
        this.title.textContent = mode === 'photo' ? `Photo: ${f.obj.name}` : mode === 'collage' ? `Photo ${n}: ${f.obj.name}` : `Clip ${n}: ${f.obj.name}`;
        if (KS.isPhoto()) this.buildPhoto(f.obj); else this.buildClip(f.obj);
      }
      else if (f.type === 'overlay') { this.title.textContent = f.obj.name; this.buildOverlay(f.obj); }
      else if (f.type === 'audio') { this.title.textContent = f.obj.name; this.buildAudio(f.obj); }
      this.el.querySelectorAll('details.sec').forEach((d) => {
        const k = d.querySelector('summary').textContent;
        if (k in openState) d.open = openState[k];
      });
      this.el.scrollTop = keepScroll;
    },

    /* ----- project ----- */
    buildProject() {
      const P = KS.project;
      if (KS.isPhoto()) { this.buildPhotoProject(); return; }
      const s = section(this.el, 'Canvas');
      const aspects = Object.keys(KS.ASPECTS).map((a) => [a, `${a}  (${KS.ASPECTS[a].join(' × ')})`]);
      if (KS.player.width) aspects.push(['source', `Match first clip (${KS.player.width} × ${KS.player.height})`]);
      select(s, 'Aspect ratio', P.canvas, 'aspect', aspects, (a) => KS.app.setAspect(a));
      select(s, 'Frame rate', P.canvas, 'fps', [[24, '24 fps'], [25, '25 fps'], [30, '30 fps'], [50, '50 fps'], [60, '60 fps']]);
      hint(s, `Output size ${P.canvas.w} × ${P.canvas.h}. Length ${KS.fmtSec(KS.player.duration)} with ${P.clips.length} clip${P.clips.length === 1 ? '' : 's'}.`);

      const au = section(this.el, 'Master sound');
      range(au, 'Master volume', P.master, 'volume', { min: 0, max: 200, scale: 100, unit: '%', onInput: () => KS.player.sync(KS.player.playing) });
      check(au, 'Mute everything', P.master, 'muted', () => KS.player.sync(KS.player.playing));
      hint(au, 'Affects every clip, overlay and audio track, in preview and in the exported file.');

      const miss = KS.mediaLib.missingNames();
      if (miss.length) {
        const m = section(this.el, 'Missing media');
        m.append(el('p', { class: 'warn' }, `This project uses ${miss.length} file${miss.length === 1 ? '' : 's'} that ${miss.length === 1 ? 'isn’t' : 'aren’t'} loaded: ${miss.join(', ')}.`));
        buttons(m, [['Find the files…', () => KS.app.pickRelink(), 'primary']]);
        hint(m, 'Choose them all at once. Each file is matched by its name.');
      }

      const q = section(this.el, 'Preview');
      const qs = el('select', { id: 'fq' },
        el('option', { value: '1', selected: KS.ui.quality === 1 }, 'Full resolution'),
        el('option', { value: '0.5', selected: KS.ui.quality === 0.5 }, 'Half (smoother on slow machines)'),
        el('option', { value: '0.25', selected: KS.ui.quality === 0.25 }, 'Quarter'));
      qs.addEventListener('change', () => { KS.ui.quality = Number(qs.value); KS.app.applyCanvasSize(); });
      row(q, 'Preview quality', qs, 'fq');
      hint(q, 'Export always renders at the resolution you choose in the export window.');

      this.buildAIEngine();
      const g = section(this.el, 'Getting started');
      hint(g, 'Import videos and photos to build the video track, then add text, overlays and music. Knockout text shows your video only inside the letters; the background fills everything else.');
      buttons(g, [['Import media', () => KS.app.pickMedia()], ['Add text', () => KS.app.addText()], ['Add music', () => KS.app.pickAudio()], ['Edit background', () => KS.select('background')]]);
    },

    buildAIEngine() {
      const s = section(this.el, 'AI engine', false);
      const info = KS.ai.gpuInfo();
      select(s, 'Run AI on', KS.ai, 'engine', [['auto', 'Automatic'], ['gpu', 'Graphics card'], ['cpu', 'Processor']], (v) => KS.ai.setEngine(v));
      hint(s, info.ok ? `Graphics card found: ${info.name}. Automatic uses it.` : 'No hardware graphics found, so Automatic uses the processor. AI tools still work, a little slower.');
    },
    buildPhotoProject() {
      const P = KS.project, C = P.collage;
      if (P.mode === 'collage') {
        const s = section(this.el, 'Collage');
        const opts = KS.collageLayouts(P.clips.length);
        const grid = el('div', { class: 'layout-grid', role: 'radiogroup', 'aria-label': 'Layout' });
        opts.forEach((L, i) => {
          const on = ((C.layout % opts.length) + opts.length) % opts.length === i;
          const b = el('button', { type: 'button', class: 'layout' + (on ? ' on' : ''), role: 'radio', 'aria-checked': on ? 'true' : 'false', 'aria-label': `Layout ${i + 1}` });
          L.forEach(([x, y, w, h]) => b.append(el('span', { style: `left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%` })));
          b.addEventListener('click', () => { C.layout = i; KS.commit(); changed(); this.build(); });
          grid.append(b);
        });
        s.append(grid);
        const shapes = Object.keys(KS.COLLAGE_ASPECTS).map((a) => [a, a]);
        seg(s, 'Shape', P.canvas, 'aspect', shapes, (a) => KS.app.setCollageAspect(a));
        range(s, 'Spacing', C, 'spacing', { min: 0, max: 80, unit: 'px' });
        range(s, 'Rounded corners', C, 'radius', { min: 0, max: 100, unit: '%' });
        color(s, 'Border colour', C, 'color');
        buttons(s, [['Add photos…', () => KS.app.pickMedia(), 'primary'], ['Shuffle photos', () => { P.clips.push(P.clips.shift()); KS.commit(); changed(); KS.emit('layers'); }]]);
        hint(s, `${P.clips.length} of ${KS.COLLAGE_MAX} photos. Click a photo to edit it on its own; drag it to move it inside its cell.`);
      } else {
        const s = section(this.el, 'Picture');
        hint(s, `Size ${P.canvas.w} × ${P.canvas.h} pixels. Crop, AI upscale and every edit can be changed again later.`);
        buttons(s, [['Edit the photo', () => KS.select(P.clips[0].id), 'primary'], ['Add text', () => KS.app.addText()], ['Stickers', () => KS.tools.stickers()]]);
      }
      this.buildAIEngine();
      const g = section(this.el, 'Saving');
      hint(g, 'Save photo writes a PNG, JPG or WebP at the original size or larger, using AI to enlarge your photos. Your work is kept in Drafts automatically.');
      buttons(g, [['Save photo…', () => KS.app.openExport(), 'primary']]);
    },

    /* ----- clip (v1 "source", one per clip on the video track) ----- */
    buildClip(C) {
      const S = C, P = KS.project;
      const lay = KS.seq.layout();
      const e = lay.find((x) => x.clip === C);
      const m = C.kind === 'video' ? KS.mediaLib.get(C.mediaId) : null;
      const sec = section(this.el, 'Media');
      const kindLabel = { video: 'Video', image: 'Photo', demo: 'Built-in demo animation', color: 'Colour clip' }[C.kind];
      const info = el('div', { class: 'media-info' },
        el('strong', {}, C.name),
        el('span', {}, C.kind === 'video'
          ? (m ? `${kindLabel}, ${m.w} × ${m.h}, ${KS.fmtSec(m.duration)}` : `${kindLabel} (not loaded)`)
          : C.kind === 'image' ? `${kindLabel}, ${C.srcW} × ${C.srcH}` : kindLabel),
        el('span', {}, `On the timeline ${KS.fmtSec(e.start)} – ${KS.fmtSec(e.end)} (${KS.fmtSec(e.len)})`));
      sec.append(info);
      if (C.kind === 'video' && !m) {
        sec.append(el('p', { class: 'warn' }, `This clip uses “${C.mediaName}”. Find the file to continue editing.`));
        buttons(sec, [['Find the file…', () => KS.app.pickRelink(), 'primary']]);
      }
      const nm = el('input', { type: 'text', id: 'fClipName', value: C.name });
      nm.addEventListener('change', () => { C.name = nm.value.trim() || 'Clip'; KS.commit(); KS.emit('layers'); this.build(); });
      row(sec, 'Clip name', nm, 'fClipName');
      buttons(sec, [['Replace media', () => KS.app.pickReplace(C.id), 'primary'], ['Crop', () => KS.tools.crop(C)], ['Use demo animation', () => KS.app.useDemo(C.id)]]);
      buttons(sec, [['Duplicate', () => KS.app.duplicate()], ['Split at playhead', () => KS.app.split()], ['Freeze frame', () => KS.app.freezeFrame()], ['Delete', () => KS.app.removeSelected(), 'danger']]);
      if (C.kind === 'color') color(sec, 'Colour', C, 'color', () => KS.emit('layers'));
      if (C.kind !== 'video') {
        range(sec, 'Duration', S, 'duration', { min: 0.2, max: 600, step: 0.1, unit: 's', onCommit: () => KS.emit('duration') });
      }

      if (C.kind === 'video') {
        const tr = section(this.el, 'Trim');
        const srcD = KS.seq.srcLen(C);
        if (S.trimOut == null) S.trimOut = srcD;
        const refresh = () => { KS.emit('duration'); KS.player.seek(Math.min(KS.player.t, KS.player.duration)); };
        range(tr, 'In point', S, 'trimIn', {
          min: 0, max: srcD, step: 0.01, unit: 's',
          onInput: () => { if (S.trimIn > S.trimOut - 0.1) S.trimIn = Math.max(0, S.trimOut - 0.1); },
          onCommit: refresh,
        });
        range(tr, 'Out point', S, 'trimOut', {
          min: 0, max: srcD, step: 0.01, unit: 's',
          onInput: () => { if (S.trimOut < S.trimIn + 0.1) S.trimOut = Math.min(srcD, S.trimIn + 0.1); },
          onCommit: refresh,
        });
        buttons(tr, [
          ['Set in at playhead', () => KS.app.setIn()],
          ['Set out at playhead', () => KS.app.setOut()],
          ['Reset', () => { S.trimIn = 0; S.trimOut = srcD; KS.commit(); refresh(); this.build(); }],
        ]);
        hint(tr, `Keeping ${KS.fmtSec(S.trimOut - S.trimIn)} of ${KS.fmtSec(srcD)}. Shortcuts: I and O. You can also drag the clip’s edges on the timeline.`);

        const pb = section(this.el, 'Speed and sound');
        range(pb, 'Speed', S, 'speed', { min: 0.1, max: 8, step: 0.05, unit: '×', onCommit: () => { KS.emit('duration'); KS.player.seek(Math.min(KS.player.t, KS.player.duration)); } });
        buttons(pb, [['0.25×', () => this.setSpeed(C, 0.25)], ['0.5×', () => this.setSpeed(C, 0.5)], ['1×', () => this.setSpeed(C, 1)], ['2×', () => this.setSpeed(C, 2)], ['4×', () => this.setSpeed(C, 4)]]);
        range(pb, 'Volume', S, 'volume', { min: 0, max: 200, step: 1, scale: 100, unit: '%', onInput: () => KS.player.sync(KS.player.playing) });
        check(pb, 'Mute this clip', S, 'muted', () => KS.player.sync(KS.player.playing));
        check(pb, 'Play backwards (reverse)', S, 'reverse', () => { KS.emit('duration'); KS.player.seek(KS.player.t); KS.emit('layers'); this.build(); });
        if (S.reverse) hint(pb, 'Reversed clips may stutter in the preview, and their sound is heard only in the exported video. The export is smooth.');
        range(pb, 'Sound fade in', S, 'fadeIn', { min: 0, max: 10, step: 0.1, unit: 's' });
        range(pb, 'Sound fade out', S, 'fadeOut', { min: 0, max: 10, step: 0.1, unit: 's' });
        buttons(pb, [['Extract audio to a track', () => KS.app.extractAudio(C.id)]]);
      }

      if (C.kind === 'video' || C.kind === 'image') this.buildCutout(C, true);

      const idx = P.clips.indexOf(C);
      const tsec = section(this.el, 'Transition', idx > 0);
      if (idx === 0) hint(tsec, 'The first clip has nothing before it. Transitions are set on the clip they lead into.');
      else {
        select(tsec, `From clip ${idx}`, C.transition, 'type', KS.TRANSITIONS, () => { KS.emit('duration'); this.build(); });
        if (C.transition.type !== 'none') {
          range(tsec, 'Length', C.transition, 'dur', { min: 0.1, max: 3, step: 0.05, unit: 's', onCommit: () => KS.emit('duration') });
          if (e.tin + 0.01 < C.transition.dur) hint(tsec, `Limited to ${KS.fmtSec(e.tin)} because one of the clips is short.`);
        }
        buttons(tsec, [['Use on every cut', () => {
          P.clips.forEach((x, i) => { if (i > 0) x.transition = { ...C.transition }; });
          KS.commit(); KS.emit('duration'); KS.toast('Transition applied between every clip.');
        }]]);
        hint(tsec, 'The two clips overlap during the transition, so the video gets slightly shorter.');
      }

      const mo = section(this.el, 'Motion', false);
      select(mo, 'Camera move', C.motion, 'type', KS.MOTIONS, () => this.build());
      if (C.motion.type !== 'none') range(mo, 'Strength', C.motion, 'amount', { min: 0.2, max: 3, step: 0.1, unit: '×' });
      hint(mo, 'A slow zoom or pan over the whole clip. Great on photos.');

      this.buildPictureSections(C);
    },

    /* AI tools: upscale (pictures), background removal (pictures and videos), backdrop (clips). */
    buildCutout(X, isClip) {
      const cu = X.cutout, img = X.kind === 'image';
      if (img) {
        const ai = section(this.el, 'AI tools');
        buttons(ai, [
          ['✨ AI upscale…', () => KS.tools.upscale(X), 'primary'],
          ['Remove background', () => KS.tools.removeBg(X)],
          ['Erase by hand…', () => KS.tools.refine(X)],
        ]);
        if (X.originalAssetId) {
          const cmp = el('button', { type: 'button', class: 'btn small', title: 'Hold to see the original picture' }, 'Hold to compare');
          const on = () => { KS.renderer.compare = X.id; KS.requestRender(); };
          const off = () => { KS.renderer.compare = null; KS.requestRender(); };
          cmp.addEventListener('pointerdown', on); cmp.addEventListener('pointerup', off); cmp.addEventListener('pointerleave', off);
          cmp.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') on(); });
          cmp.addEventListener('keyup', off);
          const w = buttons(ai, [['Undo upscale', () => KS.tools.revertOriginal(X)]]);
          w.prepend(cmp);
        }
        hint(ai, `Upscale makes the picture bigger and sharper. Remove background finds the people in the photo and cuts them out. The AI runs on this computer${KS.ai.backend ? ', on the ' + KS.ai.engineLabel() : ''}.`);
      }
      const active = cu.ai || (isClip && X.chroma.enabled);
      const sec = section(this.el, img ? 'Cut-out' : 'Remove background (AI)', active);
      if (!img) {
        const st = { on: cu.ai };
        check(sec, 'Remove the background behind people', st, 'on', (v) => {
          if (v) KS.tools.removeBg(X); else { cu.ai = false; KS.commit(); KS.requestRender(); this.build(); }
        });
      } else if (cu.ai) {
        buttons(sec, [['Refine with brush…', () => KS.tools.refine(X), 'primary'], ['Remove cut-out', () => { cu.ai = false; cu.maskId = null; KS.renderer.cutCache = {}; KS.commit(); KS.requestRender(); this.build(); }, 'danger']]);
      } else hint(sec, 'Use Remove background or Erase by hand above.');
      if (cu.ai) {
        range(sec, 'Edge tightness', cu, 'threshold', { min: 0.1, max: 0.9, step: 0.01, scale: 100, unit: '%' });
        range(sec, 'Edge softness', cu, 'feather', { min: 0, max: 20, step: 0.5, unit: 'px' });
        hint(sec, img ? 'Raise Edge tightness if bits of background remain; lower it if parts of the person disappear.' : 'Works on people. The preview may lag a little; the export is exact on every frame.');
      }
      if (isClip) {
        check(sec, 'Also remove a colour (green screen)', X.chroma, 'enabled', () => this.build());
        if (X.chroma.enabled) {
          color(sec, 'Colour to remove', X.chroma, 'color');
          buttons(sec, [['Green', () => { X.chroma.color = '#00ff00'; KS.commit(); changed(); this.build(); }], ['Blue', () => { X.chroma.color = '#0047bb'; KS.commit(); changed(); this.build(); }], ['White', () => { X.chroma.color = '#ffffff'; KS.commit(); changed(); this.build(); }]]);
          range(sec, 'Strength', X.chroma, 'tolerance', { min: 0, max: 100, unit: '' });
          range(sec, 'Edge softness', X.chroma, 'softness', { min: 0, max: 100, unit: '' });
        }
        if (cu.ai || X.chroma.enabled) {
          const B = X.backdrop;
          seg(sec, 'Behind', B, 'type', [['none', KS.isPhoto() ? 'Clear' : 'Black'], ['blur', 'Blur'], ['color', 'Colour'], ['gradient', 'Gradient'], ['image', 'Picture']], () => this.build());
          if (B.type === 'blur') range(sec, 'Blur amount', B, 'blur', { min: 2, max: 120, unit: 'px' });
          if (B.type === 'color') color(sec, 'Colour', B, 'color');
          if (B.type === 'gradient') { color(sec, 'From', B, 'gradA'); color(sec, 'To', B, 'gradB'); }
          if (B.type === 'image') {
            buttons(sec, [[B.assetId ? 'Change picture…' : 'Choose a picture…', () => {
              const inp = el('input', { type: 'file', accept: 'image/*' });
              inp.addEventListener('change', async () => {
                const f = inp.files[0]; if (!f) return;
                B.assetId = await KS.addImageAsset(await KS.fileToDataURL(f, 4096));
                KS.commit(); KS.requestRender(); this.build();
              });
              inp.click();
            }, 'primary']]);
          }
          hint(sec, B.type === 'blur' ? 'Blur keeps the person sharp and softens everything behind them, like portrait mode.' : B.type === 'none' && KS.isPhoto() ? 'Clear leaves the background see-through when you save as PNG or WebP.' : 'What appears behind the cut-out.');
        }
      }
    },

    /* ----- photo projects ----- */
    buildPhoto(C) {
      const P = KS.project;
      const sec = section(this.el, 'Photo');
      const as = KS.assets[C.assetId];
      const orig = C.originalAssetId && KS.assets[C.originalAssetId];
      sec.append(el('div', { class: 'media-info' }, el('strong', {}, C.name),
        el('span', {}, as ? `${as.img.naturalWidth} × ${as.img.naturalHeight} pixels${C.upscaled > 1 ? ` · AI upscaled ${C.upscaled}×` : ''}` : 'Picture missing'),
        orig ? el('span', {}, `Original ${orig.img.naturalWidth} × ${orig.img.naturalHeight}`) : null,
        C.crop ? el('span', {}, 'Cropped') : null));
      buttons(sec, [['Crop and rotate…', () => KS.tools.crop(C), 'primary'], ['Replace photo…', () => KS.app.pickReplace(C.id)]]);
      if (P.mode === 'collage') buttons(sec, [['Duplicate', () => KS.app.duplicate()], ['Delete', () => KS.app.removeSelected(), 'danger']]);
      this.buildCutout(C, true);
      this.buildPictureSections(C);
    },

    /* Framing, filters and adjustments: shared by clips, photos and collage photos. */
    buildPictureSections(C) {
      const S = C, P = KS.project;
      const fr = section(this.el, 'Framing', !KS.isPhoto());
      buttons(fr, [['Crop and rotate…', () => KS.tools.crop(C), 'primary']]);
      seg(fr, 'Fit', S, 'fit', [['cover', 'Fill'], ['contain', 'Fit'], ['stretch', 'Stretch']]);
      range(fr, 'Zoom', S, 'zoom', { min: 0.2, max: 6, step: 0.01, unit: '×' });
      range(fr, 'Move X', S, 'offsetX', { min: -50, max: 50, step: 0.5, scale: 100, unit: '%' });
      range(fr, 'Move Y', S, 'offsetY', { min: -50, max: 50, step: 0.5, scale: 100, unit: '%' });
      range(fr, 'Rotate', S, 'rotation', { min: -180, max: 180, step: 1, unit: '°' });
      buttons(fr, [['↺ 90°', () => { S.rotation = ((S.rotation - 90 + 540) % 360) - 180; KS.commit(); changed(); this.build(); }], ['↻ 90°', () => { S.rotation = ((S.rotation + 90 + 540) % 360) - 180; KS.commit(); changed(); this.build(); }]]);
      check(fr, 'Flip horizontally', S, 'flipH');
      check(fr, 'Flip vertically', S, 'flipV');
      buttons(fr, [['Reset framing', () => { Object.assign(S, { fit: 'cover', zoom: 1, offsetX: 0, offsetY: 0, rotation: 0, flipH: false, flipV: false }); KS.commit(); changed(); this.build(); }]]);
      if (KS.project.mode === 'collage') hint(fr, 'Drag the photo inside its cell to move it; scroll the mouse wheel over it to zoom.');

      const lk = section(this.el, KS.isPhoto() ? 'Filters' : 'Looks');
      buttons(lk, [['✨ Auto enhance', () => KS.tools.autoEnhance(C), 'primary']]);
      const grid = el('div', { class: 'look-grid' });
      KS.LOOKS.forEach(([id, label, vals]) => {
        const b = el('button', { type: 'button', class: 'look' + (C.look === id ? ' on' : '') }, label);
        b.addEventListener('click', () => {
          C.look = id;
          C.filters = KS.merge(KS.defaultFilters(), vals);
          KS.commit(); changed(); this.build();
        });
        grid.append(b);
      });
      lk.append(grid);
      hint(lk, 'A filter sets the adjustments below as a starting point; fine-tune them afterwards.');

      const ad = section(this.el, 'Adjustments', false);
      const F = S.filters;
      range(ad, 'Brightness', F, 'brightness', { min: 0, max: 200, unit: '%' });
      range(ad, 'Contrast', F, 'contrast', { min: 0, max: 200, unit: '%' });
      range(ad, 'Saturation', F, 'saturate', { min: 0, max: 300, unit: '%' });
      range(ad, 'Warmth', F, 'temperature', { min: -100, max: 100, unit: '' });
      range(ad, 'Hue', F, 'hue', { min: -180, max: 180, unit: '°' });
      range(ad, 'Sharpen', F, 'sharpen', { min: 0, max: 100, step: 10, unit: '%' });
      range(ad, 'Vignette', F, 'vignette', { min: 0, max: 100, unit: '%' });
      range(ad, 'Film grain', F, 'grain', { min: 0, max: 100, unit: '%' });
      range(ad, 'Blur', F, 'blur', { min: 0, max: 30, step: 0.5, unit: 'px' });
      range(ad, 'Greyscale', F, 'grayscale', { min: 0, max: 100, unit: '%' });
      range(ad, 'Sepia', F, 'sepia', { min: 0, max: 100, unit: '%' });
      range(ad, 'Invert', F, 'invert', { min: 0, max: 100, unit: '%' });
      buttons(ad, [
        ...(P.clips.length > 1 ? [[KS.isPhoto() ? 'Apply to all photos' : 'Apply to all clips', () => { P.clips.forEach((x) => { x.filters = { ...F }; x.look = C.look; }); KS.commit(); changed(); KS.toast('Filter and adjustments copied to every ' + (KS.isPhoto() ? 'photo.' : 'clip.')); }]] : []),
        ['Reset', () => { C.filters = KS.defaultFilters(); C.look = 'none'; KS.commit(); changed(); this.build(); }],
      ]);
      hint(ad, KS.isPhoto() ? 'Every slider can be changed again later; your original photo is never altered.' : 'Adjustments apply everywhere this clip appears, including inside the letters.');
    },


    setSpeed(C, v) { C.speed = v; KS.commit(); KS.emit('duration'); KS.player.seek(Math.min(KS.player.t, KS.player.duration)); this.build(); },

    /* ----- overlay ----- */
    buildOverlay(O) {
      const m = O.kind === 'video' ? KS.mediaLib.get(O.mediaId) : null;
      const sec = section(this.el, 'Media');
      sec.append(el('div', { class: 'media-info' }, el('strong', {}, O.mediaName || O.name),
        el('span', {}, O.kind === 'video' ? (m ? `Video, ${m.w} × ${m.h}, ${KS.fmtSec(m.duration)}` : 'Video (not loaded)') : `Picture, ${O.srcW} × ${O.srcH}`)));
      if (O.kind === 'video' && !m) buttons(sec, [['Find the file…', () => KS.app.pickRelink(), 'primary']]);
      const nm = el('input', { type: 'text', id: 'fOvName', value: O.name });
      nm.addEventListener('change', () => { O.name = nm.value.trim() || 'Overlay'; KS.commit(); KS.emit('layers'); this.build(); });
      row(sec, 'Layer name', nm, 'fOvName');
      buttons(sec, [['Replace…', () => KS.app.pickOverlay(O.id), 'primary'], ['Duplicate', () => KS.app.duplicate()], ['Delete', () => KS.app.removeSelected(), 'danger']]);
      if (O.kind === 'video') {
        range(sec, 'Start inside video', O, 'trimIn', { min: 0, max: m ? m.duration : 60, step: 0.01, unit: 's' });
        const snd = { on: !O.muted };
        check(sec, 'Play its sound', snd, 'on', (v) => { O.muted = !v; KS.commit(); KS.player.sync(KS.player.playing); this.build(); });
        if (!O.muted) range(sec, 'Volume', O, 'volume', { min: 0, max: 200, scale: 100, unit: '%', onInput: () => KS.player.sync(KS.player.playing) });
      }

      const ps = section(this.el, 'Size and position');
      range(ps, 'Size', O, 'width', { min: 2, max: 200, step: 0.5, scale: 100, unit: '%' });
      range(ps, 'Horizontal', O, 'x', { min: -50, max: 150, step: 0.1, scale: 100, unit: '%' });
      range(ps, 'Vertical', O, 'y', { min: -50, max: 150, step: 0.1, scale: 100, unit: '%' });
      range(ps, 'Rotate', O, 'rotation', { min: -180, max: 180, unit: '°' });
      range(ps, 'Opacity', O, 'opacity', { min: 0, max: 100, scale: 100, unit: '%' });
      const put = (x, y) => { O.x = x; O.y = y; KS.commit(); changed(); this.build(); };
      buttons(ps, [['↖', () => put(0.18, 0.2)], ['↗', () => put(0.82, 0.2)], ['Centre', () => put(0.5, 0.5)], ['↙', () => put(0.18, 0.8)], ['↘', () => put(0.82, 0.8)], ['Full screen', () => { O.width = 1; put(0.5, 0.5); }]]);
      hint(ps, 'Drag it on the stage to move it. Scroll the mouse wheel over it to resize.');

      const st = section(this.el, 'Style');
      range(st, 'Rounded corners', O, 'radius', { min: 0, max: 100, unit: '%' });
      check(st, 'Border', O.border, 'enabled', () => this.build());
      if (O.border.enabled) { color(st, 'Border colour', O.border, 'color'); range(st, 'Border width', O.border, 'width', { min: 1, max: 60, unit: 'px' }); }
      check(st, 'Shadow', O.shadow, 'enabled', () => this.build());
      if (O.shadow.enabled) { color(st, 'Shadow colour', O.shadow, 'color'); range(st, 'Softness', O.shadow, 'blur', { min: 0, max: 200, unit: 'px' }); range(st, 'Offset Y', O.shadow, 'y', { min: -100, max: 100, unit: 'px' }); }
      select(st, 'Blend mode', O, 'blend', [['source-over', 'Normal'], ['screen', 'Screen (removes black)'], ['multiply', 'Multiply (removes white)'], ['overlay', 'Overlay'], ['soft-light', 'Soft light'], ['lighten', 'Lighten'], ['darken', 'Darken'], ['difference', 'Difference']]);
      seg(st, 'Place', O, 'above', [[true, 'Above text'], [false, 'Below text']], () => KS.emit('layers'));

      const ck = section(this.el, 'Remove a colour (green screen)', O.chroma.enabled);
      check(ck, 'Remove a colour (green screen)', O.chroma, 'enabled', () => this.build());
      if (O.chroma.enabled) {
        color(ck, 'Colour to remove', O.chroma, 'color');
        buttons(ck, [['Green', () => { O.chroma.color = '#00ff00'; KS.commit(); changed(); this.build(); }], ['Blue', () => { O.chroma.color = '#0047bb'; KS.commit(); changed(); this.build(); }], ['White', () => { O.chroma.color = '#ffffff'; KS.commit(); changed(); this.build(); }], ['Black', () => { O.chroma.color = '#000000'; KS.commit(); changed(); this.build(); }]]);
        range(ck, 'Strength', O.chroma, 'tolerance', { min: 0, max: 100, unit: '' });
        range(ck, 'Edge softness', O.chroma, 'softness', { min: 0, max: 100, unit: '' });
      }
      hint(ck, 'Works best on footage shot against an evenly lit green or blue screen.');

      this.buildCutout(O, false);
      if (!KS.isPhoto()) { this.buildMotion(O, true); this.buildTiming(O); }
    },

    /* ----- audio track ----- */
    buildAudio(A) {
      const m = KS.mediaLib.get(A.mediaId);
      const sec = section(this.el, 'Sound');
      sec.append(el('div', { class: 'media-info' }, el('strong', {}, A.mediaName || A.name),
        el('span', {}, m ? `${KS.fmtSec(m.duration)} long` : 'Not loaded'),
        el('span', {}, `Plays ${KS.fmtSec(A.start)} – ${KS.fmtSec(KS.mix.audioEnd(A))} on the timeline`)));
      if (!m) buttons(sec, [['Find the file…', () => KS.app.pickRelink(), 'primary']]);
      const nm = el('input', { type: 'text', id: 'fAuName', value: A.name });
      nm.addEventListener('change', () => { A.name = nm.value.trim() || 'Audio'; KS.commit(); KS.emit('layers'); this.build(); });
      row(sec, 'Track name', nm, 'fAuName');
      buttons(sec, [['Duplicate', () => KS.app.duplicate()], ['Split at playhead', () => KS.app.split()], ['Delete', () => KS.app.removeSelected(), 'danger']]);
      range(sec, 'Volume', A, 'volume', { min: 0, max: 200, scale: 100, unit: '%', onInput: () => KS.player.sync(KS.player.playing) });
      check(sec, 'Mute', A, 'muted', () => { KS.player.sync(KS.player.playing); KS.emit('layers'); });
      range(sec, 'Fade in', A, 'fadeIn', { min: 0, max: 15, step: 0.1, unit: 's' });
      range(sec, 'Fade out', A, 'fadeOut', { min: 0, max: 15, step: 0.1, unit: 's' });
      check(sec, 'Repeat until the video ends', A, 'loop', () => { KS.emit('layers'); this.build(); });

      const tm = section(this.el, 'Timing');
      const srcD = m ? m.duration : A.srcDuration || 60;
      if (A.trimOut == null) A.trimOut = srcD;
      const upd = () => { KS.emit('layers'); KS.player.sync(KS.player.playing); };
      range(tm, 'Starts at', A, 'start', { min: 0, max: Math.max(KS.player.duration, A.start), step: 0.01, unit: 's', onCommit: upd });
      range(tm, 'Cut start', A, 'trimIn', { min: 0, max: srcD, step: 0.01, unit: 's', onInput: () => { if (A.trimIn > A.trimOut - 0.1) A.trimIn = A.trimOut - 0.1; }, onCommit: upd });
      range(tm, 'Cut end', A, 'trimOut', { min: 0, max: srcD, step: 0.01, unit: 's', onInput: () => { if (A.trimOut < A.trimIn + 0.1) A.trimOut = A.trimIn + 0.1; }, onCommit: upd });
      buttons(tm, [
        ['Start at playhead', () => { A.start = Math.round(KS.player.t * 1000) / 1000; KS.commit(); upd(); this.build(); }],
        ['Start at 0', () => { A.start = 0; KS.commit(); upd(); this.build(); }],
        ['End with the video', () => { const end = KS.player.duration; A.trimOut = Math.min(srcD, A.trimIn + Math.max(0.1, end - A.start)); A.fadeOut = Math.max(A.fadeOut, 1.5); KS.commit(); upd(); this.build(); }],
      ]);
      hint(tm, 'Drag the bar on the timeline to move it; drag its edges to cut the start or end.');
    },

    buildTiming(L) {
      const tm = section(this.el, 'Timing');
      const D = KS.player.duration;
      range(tm, 'Starts at', L, 'start', { min: 0, max: D, step: 0.01, unit: 's', onInput: (v) => { if (v > L.end - 0.1) L.start = Math.max(0, L.end - 0.1); }, onCommit: () => KS.emit('layers') });
      range(tm, 'Ends at', L, 'end', { min: 0, max: D, step: 0.01, unit: 's', onInput: (v) => { if (v < L.start + 0.1) L.end = L.start + 0.1; }, onCommit: () => KS.emit('layers') });
      buttons(tm, [
        ['Start at playhead', () => { L.start = Math.min(KS.player.t, L.end - 0.1); KS.commit(); KS.emit('layers'); this.build(); }],
        ['End at playhead', () => { L.end = Math.max(KS.player.t, L.start + 0.1); KS.commit(); KS.emit('layers'); this.build(); }],
        ['Full length', () => { L.start = 0; L.end = D; KS.commit(); KS.emit('layers'); this.build(); }],
      ]);
    },

    /* ----- background ----- */
    buildBackground() {
      const B = KS.project.background;
      const s = section(this.el, 'Fill');
      seg(s, 'Type', B, 'type', [['color', 'Colour'], ['gradient', 'Gradient'], ['image', 'Image'], ['video-blur', 'Blur'], ['none', 'None']],
        () => { this.build(); KS.emit('layers'); });
      if (B.type === 'color') color(s, 'Colour', B, 'color');
      if (B.type === 'gradient') {
        seg(s, 'Style', B, 'gradKind', [['linear', 'Linear'], ['radial', 'Radial']], () => this.build());
        color(s, 'From', B, 'gradA');
        color(s, 'To', B, 'gradB');
        if (B.gradKind === 'linear') range(s, 'Angle', B, 'gradAngle', { min: 0, max: 360, unit: '°' });
      }
      if (B.type === 'image') {
        const as = B.imageId && KS.assets[B.imageId];
        if (as) s.append(el('img', { class: 'bg-thumb', src: as.dataURL, alt: 'Current background image' }));
        buttons(s, [[as ? 'Replace image' : 'Choose image', () => KS.app.pickBackgroundImage(), 'primary']]);
        seg(s, 'Fit', B, 'imageFit', [['cover', 'Fill'], ['contain', 'Fit'], ['stretch', 'Stretch'], ['tile', 'Tile']]);
        color(s, 'Backdrop', B, 'color');
        hint(s, 'Tip: drop an image straight onto the stage to use it here.');
      }
      if (B.type === 'video-blur') {
        range(s, 'Blur', B, 'blurAmount', { min: 0, max: 120, unit: 'px' });
        color(s, 'Tint', B, 'color');
        range(s, 'Tint strength', B, 'dim', { min: 0, max: 100, scale: 100, unit: '%' });
      }
      if (B.type === 'none') hint(s, 'With no background the full video shows, and text sits on top of it.');
      if (B.type !== 'none') {
        const o = section(this.el, 'Opacity');
        range(o, 'Opacity', B, 'opacity', { min: 0, max: 100, scale: 100, unit: '%' });
        hint(o, 'Lower this to let a faint copy of the video show through the background.');
      }
    },

    /* ----- text ----- */
    buildText(L) {
      const s = section(this.el, 'Text');
      const ta = el('textarea', { rows: 3, id: 'fText', spellcheck: 'false' });
      ta.value = L.text;
      ta.addEventListener('input', () => { L.text = ta.value; changed(); });
      ta.addEventListener('change', () => KS.commit());
      row(s, 'Content', ta, 'fText', 'row-stack');
      const nm = el('input', { type: 'text', id: 'fName', value: L.name });
      nm.addEventListener('change', () => { L.name = nm.value.trim() || 'Text'; KS.commit(); this.title.textContent = L.name; KS.emit('layers'); });
      row(s, 'Layer name', nm, 'fName');

      const f = section(this.el, 'Font');
      const fonts = [...KS.FONTS, ...KS.customFonts].map((x) => [x, x]);
      if (!fonts.find(([x]) => x === L.font)) fonts.push([L.font, L.font]);
      select(f, 'Typeface', L, 'font', fonts);
      buttons(f, [['Upload a font file', () => KS.app.pickFont()]]);
      select(f, 'Weight', L, 'weight', [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold'], ['900', 'Black']]);
      range(f, 'Size', L, 'size', { min: 10, max: 1200, unit: 'px' });
      range(f, 'Letter spacing', L, 'letterSpacing', { min: -40, max: 200, unit: 'px' });
      if (!KS.hasLetterSpacing) hint(f, 'Letter spacing needs a newer browser.');
      range(f, 'Line height', L, 'lineHeight', { min: 0.5, max: 3, step: 0.01, unit: '×' });
      seg(f, 'Align', L, 'align', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]);
      check(f, 'Italic', L, 'italic');
      check(f, 'All capitals', L, 'uppercase');

      const lk = section(this.el, 'Look');
      seg(lk, 'Fill mode', L, 'mode', [
        ['knockout', 'Video in text', 'The video shows only inside the letters'],
        ['inverse', 'Video around', 'The video shows everywhere except the letters'],
        ['video-outline', 'Video outline', 'The video shows inside the letter outlines'],
        ['solid', 'Solid', 'Plain coloured text'],
      ], () => this.build());
      if (L.mode === 'solid') color(lk, 'Text colour', L, 'fill');
      if (L.mode === 'video-outline') range(lk, 'Outline width', L.stroke, 'width', { min: 1, max: 60, unit: 'px' });
      range(lk, 'Opacity', L, 'opacity', { min: 0, max: 100, scale: 100, unit: '%' });
      if (L.mode !== 'video-outline') {
        check(lk, 'Outline', L.stroke, 'enabled', () => this.build());
        if (L.stroke.enabled) {
          color(lk, 'Outline colour', L.stroke, 'color');
          range(lk, 'Outline width', L.stroke, 'width', { min: 1, max: 60, unit: 'px' });
        }
      }
      if (L.mode !== 'inverse') {
        check(lk, 'Glow or shadow', L.shadow, 'enabled', () => this.build());
        if (L.shadow.enabled) {
          color(lk, 'Glow colour', L.shadow, 'color');
          range(lk, 'Softness', L.shadow, 'blur', { min: 0, max: 200, unit: 'px' });
          range(lk, 'Offset X', L.shadow, 'x', { min: -100, max: 100, unit: 'px' });
          range(lk, 'Offset Y', L.shadow, 'y', { min: -100, max: 100, unit: 'px' });
        }
      }

      const ps = section(this.el, 'Position');
      range(ps, 'Horizontal', L, 'x', { min: -50, max: 150, step: 0.1, scale: 100, unit: '%' });
      range(ps, 'Vertical', L, 'y', { min: -50, max: 150, step: 0.1, scale: 100, unit: '%' });
      range(ps, 'Rotate', L, 'rotation', { min: -180, max: 180, unit: '°' });
      range(ps, 'Scale', L, 'scale', { min: 0.1, max: 5, step: 0.01, unit: '×' });
      buttons(ps, [
        ['Centre', () => { L.x = 0.5; L.y = 0.5; KS.commit(); changed(); this.build(); }],
        ['Centre across', () => { L.x = 0.5; KS.commit(); changed(); this.build(); }],
        ['Centre down', () => { L.y = 0.5; KS.commit(); changed(); this.build(); }],
      ]);
      hint(ps, 'You can also drag the text on the stage.');

      if (!KS.isPhoto()) { this.buildMotion(L); this.buildTiming(L); }
    },

    buildMotion(L, overlay = false) {
      const a = L.anim;
      const s = section(this.el, overlay ? 'Animation' : 'Motion and scroll');
      const opts = KS.ANIM_GROUPS
        .map((g) => ({ group: g.label, items: g.items.filter(([v]) => !overlay || OVERLAY_ANIMS.has(v)).map(([v, l]) => [v, l.replace(' text', '')]) }))
        .filter((g) => g.items.length);
      select(s, 'Effect', a, 'type', opts, (type) => {
        Object.assign(a, KS.animDefaultsFor(type));
        KS.emit('layers');
        this.build();
      });
      const kind = KS.ANIM_KIND[a.type];
      const eases = KS.EASE_OPTIONS;

      if (kind === 'scroll') {
        seg(s, 'Pace', a, 'timing', [['duration', 'Fit to layer'], ['speed', 'Fixed speed']], () => this.build());
        if (a.timing === 'duration') {
          range(s, 'Passes', a, 'repeats', { min: 1, max: 20, step: 1, unit: '×' });
          hint(s, 'The text completes its journey within the layer’s time on the timeline.');
        } else {
          range(s, 'Speed', a, 'speed', { min: 10, max: 2000, step: 5, unit: 'px/s' });
          check(s, 'Repeat when finished', a, 'loop');
        }
        select(s, 'Easing', a, 'ease', eases);
      } else if (kind === 'marquee') {
        range(s, 'Speed', a, 'speed', { min: 10, max: 2000, step: 5, unit: 'px/s' });
        range(s, 'Gap between copies', a, 'gap', { min: 0, max: 1200, step: 5, unit: 'px' });
        check(s, 'Reverse direction', a, 'reverse');
      } else if (kind === 'pingpong') {
        range(s, 'Speed', a, 'speed', { min: 10, max: 2000, step: 5, unit: 'px/s' });
        range(s, 'Travel', a, 'amount', { min: 0.1, max: 2, step: 0.05, unit: '×' });
        select(s, 'Easing', a, 'ease', eases);
      } else if (kind === 'entrance') {
        range(s, 'Entrance length', a, 'inDur', { min: 0.1, max: 10, step: 0.1, unit: 's' });
        select(s, 'Easing', a, 'ease', eases);
      } else if (kind === 'loop') {
        range(s, 'Cycles per second', a, 'freq', { min: 0.05, max: 4, step: 0.05, unit: 'Hz' });
        range(s, 'Strength', a, 'amount', { min: 0, max: 4, step: 0.05, unit: '×' });
        if (a.type === 'spin') check(s, 'Anticlockwise', a, 'reverse');
      }
      if (a.type === 'zoom-through') range(s, 'Final size', a, 'amount', { min: 0.2, max: 6, step: 0.1, unit: '×' });
      range(s, 'Fade in', a, 'fadeIn', { min: 0, max: 10, step: 0.1, unit: 's' });
      range(s, 'Fade out', a, 'fadeOut', { min: 0, max: 10, step: 0.1, unit: 's' });
    },
  });
  void I;
  KS.el = el;
})();
