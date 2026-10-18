/* AK Knockout Studio — picture tools
 *
 *   KS.tools.crop(clip)          crop, quarter turns and straighten (photos and video clips)
 *   KS.tools.upscale(item)       AI upscale a photo clip or picture overlay (2× / 4×)
 *   KS.tools.removeBg(item)      AI person cut-out (photos: once; videos: every frame)
 *   KS.tools.refine(item)        erase / restore brush for a photo's cut-out
 *   KS.tools.autoEnhance(clip)   one-tap colour fix
 *   KS.tools.stickers()          emoji and shape stickers as overlays
 */
(function () {
  'use strict';
  const KS = window.KS;
  const $ = (id) => document.getElementById(id);

  function h(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  const btn = (label, onclick, cls = 'btn') => h('button', { type: 'button', class: cls, onclick }, label);

  function dialog(id, title, wide) {
    let d = $(id);
    if (d) d.remove();
    d = h('dialog', { id, class: 'dlg' + (wide ? ' dlg-wide' : ''), 'aria-label': title });
    d.append(h('h2', { text: title }));
    document.body.append(d);
    d.addEventListener('close', () => setTimeout(() => d.remove(), 0));
    return d;
  }

  /* A picture's current pixels: photo asset, or the visible frame of a video. */
  function rawSource(item) {
    if (item.kind === 'image') {
      const as = KS.assets[item.assetId];
      return as ? as.img : null;
    }
    if (item.kind === 'video') {
      const pe = KS.pool.peek(item.id);
      if (!pe || pe.el.readyState < 2) return null;
      const c = document.createElement('canvas');
      c.width = pe.el.videoWidth; c.height = pe.el.videoHeight;
      c.getContext('2d').drawImage(pe.el, 0, 0);
      return c;
    }
    return null;
  }
  const dims = (s) => [s.naturalWidth || s.videoWidth || s.width, s.naturalHeight || s.videoHeight || s.height];

  async function canvasToAsset(cv, forcePng) {
    const alpha = forcePng || KS.ai.hasAlpha(cv.getContext('2d'), cv.width, cv.height);
    const url = cv.toDataURL(alpha ? 'image/png' : 'image/jpeg', 0.95);
    return KS.addImageAsset(url);
  }

  /* ---------- progress window for long jobs ---------- */
  function task(title, note) {
    const d = dialog('taskDlg', title);
    d.append(h('p', { class: 'dlg-note', text: note || '' }));
    const bar = h('div', { class: 'ex-bar' });
    d.append(h('div', { class: 'ex-progress', 'aria-hidden': 'true' }, bar));
    const st = h('p', { class: 'dlg-status', role: 'status', 'aria-live': 'polite' });
    d.append(st);
    const ctrl = new AbortController();
    const cancel = btn('Cancel', () => { ctrl.abort(); d.close(); });
    d.append(h('div', { class: 'dlg-actions' }, cancel));
    d.addEventListener('cancel', () => ctrl.abort());
    d.showModal();
    return {
      signal: ctrl.signal,
      progress(p, msg) { bar.style.width = (KS.clamp(p, 0, 1) * 100).toFixed(1) + '%'; if (msg) st.textContent = msg; },
      close() { if (d.open) d.close(); },
      fail(msg) { d.dataset.state = 'error'; st.textContent = msg; cancel.textContent = 'Close'; },
    };
  }

  const T = (KS.tools = {
    /* ---------- crop and rotate ---------- */
    crop(C) {
      const src = rawSource(C);
      if (!src) { KS.toast('Load the clip first (move the playhead onto it).'); return; }
      const [sw, sh] = dims(src);
      const st = KS.merge({ x: 0, y: 0, w: 1, h: 1, rot: 0, angle: 0 }, C.crop || {});
      let ratio = 0; // 0 = free
      const d = dialog('cropDlg', 'Crop and rotate', true);
      const cv = h('canvas', { class: 'crop-cv', 'aria-label': 'Crop area. Drag the corners or the middle.' });
      const wrap = h('div', { class: 'crop-wrap' }, cv);
      d.append(wrap);
      const info = h('p', { class: 'dlg-note crop-info' });
      const ratios = [['Free', 0], ['Original', -1], ['1:1', 1], ['4:5', 4 / 5], ['9:16', 9 / 16], ['16:9', 16 / 9], ['3:2', 3 / 2], ['2:3', 2 / 3], ['4:3', 4 / 3]];
      const chips = h('div', { class: 'chip-row', role: 'group', 'aria-label': 'Shape' });
      const setRatio = (r) => {
        ratio = r === -1 ? (st.rot % 180 ? sh / sw : sw / sh) : r;
        chips.querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.r) === r));
        if (ratio) fitRatio();
        draw();
      };
      ratios.forEach(([l, r]) => { const b = btn(l, () => setRatio(r), 'chip'); b.dataset.r = r; chips.append(b); });
      chips.firstChild.classList.add('on');
      const angle = h('input', { type: 'range', min: -45, max: 45, step: 0.5, value: st.angle, 'aria-label': 'Straighten' });
      const angleVal = h('span', { class: 'crop-angle', text: st.angle + '°' });
      angle.addEventListener('input', () => { st.angle = Number(angle.value); angleVal.textContent = st.angle + '°'; build(); draw(); });
      const turn = (dir) => { st.rot = (st.rot + (dir > 0 ? 90 : 270)) % 360; st.x = 0; st.y = 0; st.w = 1; st.h = 1; build(); if (ratio) fitRatio(); draw(); };
      d.append(h('div', { class: 'crop-tools' },
        chips,
        h('div', { class: 'crop-row' }, btn('↺ 90°', () => turn(-1)), btn('↻ 90°', () => turn(1)),
          h('label', { class: 'crop-straighten' }, 'Straighten ', angle, angleVal))));
      d.append(info);
      d.append(h('div', { class: 'dlg-actions' },
        btn('Reset', () => { Object.assign(st, { x: 0, y: 0, w: 1, h: 1, rot: 0, angle: 0 }); angle.value = 0; angleVal.textContent = '0°'; setRatio(0); build(); draw(); }),
        btn('Cancel', () => d.close()),
        btn('Apply', () => { apply(); d.close(); }, 'btn primary')));

      // the turned, straightened picture (without crop) used for display
      let turned = null, tw = 0, th = 0, scale = 1;
      const build = () => {
        const p = KS.renderer.prepare('crop-dialog', { x: 0, y: 0, w: 1, h: 1, rot: st.rot, angle: st.angle }, { src, sw, sh }, null);
        turned = p.src; tw = p.sw; th = p.sh;
      };
      const fitRatio = () => {
        // biggest rectangle of the chosen shape, centred on the current one
        const want = ratio * (th / tw); // in normalised units: w/h
        const cx = st.x + st.w / 2, cy = st.y + st.h / 2;
        let w = st.w, hh = w / want;
        if (hh > 1) { hh = 1; w = want; }
        if (w > 1) { w = 1; hh = 1 / want; }
        st.w = w; st.h = hh;
        st.x = KS.clamp(cx - w / 2, 0, 1 - w); st.y = KS.clamp(cy - hh / 2, 0, 1 - hh);
      };
      const draw = () => {
        const box = wrap.getBoundingClientRect();
        const maxW = Math.max(200, box.width || 700), maxH = Math.min(window.innerHeight * 0.58, 560);
        scale = Math.min(maxW / tw, maxH / th);
        const W = Math.round(tw * scale), H = Math.round(th * scale);
        const dpr = window.devicePixelRatio || 1;
        cv.width = W * dpr; cv.height = H * dpr;
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        const x = cv.getContext('2d');
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        x.drawImage(turned, 0, 0, W, H);
        const rx = st.x * W, ry = st.y * H, rw = st.w * W, rh = st.h * H;
        x.fillStyle = 'rgba(0,0,0,.55)';
        x.fillRect(0, 0, W, ry); x.fillRect(0, ry + rh, W, H - ry - rh);
        x.fillRect(0, ry, rx, rh); x.fillRect(rx + rw, ry, W - rx - rw, rh);
        x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1;
        for (const f of [1 / 3, 2 / 3]) {
          x.beginPath(); x.moveTo(rx + rw * f, ry); x.lineTo(rx + rw * f, ry + rh); x.stroke();
          x.beginPath(); x.moveTo(rx, ry + rh * f); x.lineTo(rx + rw, ry + rh * f); x.stroke();
        }
        x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(rx, ry, rw, rh);
        x.fillStyle = '#fff';
        for (const [px, py] of [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]]) x.fillRect(px - 5, py - 5, 10, 10);
        const out = KS.renderer.cropSize(st, sw, sh);
        info.textContent = `Result ${out.w} × ${out.h} pixels. Drag the corners to resize, the middle to move.`;
      };
      let drag = null;
      cv.addEventListener('pointerdown', (e) => {
        const r = cv.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const tolX = 14 / r.width, tolY = 14 / r.height;
        const near = (a, b, t) => Math.abs(a - b) < t;
        const L = near(px, st.x, tolX), Rr = near(px, st.x + st.w, tolX), Tp = near(py, st.y, tolY), B = near(py, st.y + st.h, tolY);
        const inside = px > st.x && px < st.x + st.w && py > st.y && py < st.y + st.h;
        if (!(L || Rr || Tp || B || inside)) return;
        drag = { px, py, s0: { ...st }, L, R: Rr, T: Tp, B, move: !(L || Rr || Tp || B) };
        cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const r = cv.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - drag.px, dy = (e.clientY - r.top) / r.height - drag.py;
        const s0 = drag.s0, min = 0.04;
        if (drag.move) {
          st.x = KS.clamp(s0.x + dx, 0, 1 - s0.w); st.y = KS.clamp(s0.y + dy, 0, 1 - s0.h);
        } else {
          let x0 = s0.x, y0 = s0.y, x1 = s0.x + s0.w, y1 = s0.y + s0.h;
          if (drag.L) x0 = KS.clamp(x0 + dx, 0, x1 - min);
          if (drag.R) x1 = KS.clamp(x1 + dx, x0 + min, 1);
          if (drag.T) y0 = KS.clamp(y0 + dy, 0, y1 - min);
          if (drag.B) y1 = KS.clamp(y1 + dy, y0 + min, 1);
          if (ratio) {
            const want = ratio * (th / tw);
            let w = x1 - x0, hh = y1 - y0;
            if (drag.L || drag.R) hh = w / want; else w = hh * want;
            if (drag.T && !drag.L && !drag.R) { /* height drives */ }
            if (w > 1) { w = 1; hh = w / want; } if (hh > 1) { hh = 1; w = hh * want; }
            if (drag.L) x0 = x1 - w; else x1 = x0 + w;
            if (drag.T) y0 = y1 - hh; else y1 = y0 + hh;
            if (x0 < 0) { x0 = 0; x1 = w; } if (x1 > 1) { x1 = 1; x0 = 1 - w; }
            if (y0 < 0) { y0 = 0; y1 = hh; } if (y1 > 1) { y1 = 1; y0 = 1 - hh; }
          }
          st.x = x0; st.y = y0; st.w = x1 - x0; st.h = y1 - y0;
        }
        draw();
      });
      cv.addEventListener('pointerup', () => { drag = null; });
      const apply = () => {
        const none = !KS.renderer.hasCrop(st);
        C.crop = none ? null : { x: +st.x.toFixed(5), y: +st.y.toFixed(5), w: +st.w.toFixed(5), h: +st.h.toFixed(5), rot: st.rot, angle: st.angle };
        if (KS.project.mode === 'photo' && KS.project.clips[0] === C) {
          const out = none ? { w: sw, h: sh } : KS.renderer.cropSize(C.crop, sw, sh);
          KS.app.setPhotoCanvas(out.w, out.h);
        }
        KS.commit(); KS.requestRender(); KS.emit('refresh-inspector'); KS.timeline.thumbsSoon();
        KS.toast(none ? 'Crop removed.' : 'Cropped. Open Crop again at any time to change it; nothing is lost.');
      };
      build();
      d.showModal();
      requestAnimationFrame(draw);
    },

    /* ---------- AI upscale ---------- */
    upscale(item) {
      const src = item.kind === 'image' && KS.assets[item.assetId] && KS.assets[item.assetId].img;
      if (!src) { KS.toast('AI upscale works on photos and pictures.'); return; }
      const [sw, sh] = dims(src);
      const d = dialog('upDlg', 'AI upscale');
      d.append(h('p', { class: 'dlg-note', text: 'Makes the picture bigger and sharper using an AI model on your own computer. Nothing is uploaded.' }));
      const form = h('div', { class: 'dlg-form' });
      const scaleSel = h('select', {}, h('option', { value: 2 }, '2× (double size)'), h('option', { value: 4 }, '4× (four times bigger)'));
      const qSel = h('select', {}, h('option', { value: 'fast' }, 'Fast'), h('option', { value: 'detail' }, 'High detail (slower)'));
      const eng = h('select', {}, h('option', { value: 'auto' }, 'Automatic'), h('option', { value: 'gpu' }, 'Graphics card (fastest on most PCs)'), h('option', { value: 'cpu' }, 'Processor'));
      eng.value = KS.ai.engine;
      const res = h('p', { class: 'dlg-note' });
      form.append(h('label', {}, 'Scale', scaleSel), h('label', {}, 'Quality', qSel), h('label', {}, 'Run on', eng), res);
      d.append(form);
      const upd = () => {
        const s = Number(scaleSel.value);
        const ok = Math.max(sw, sh) * s <= KS.ai.MAX_OUTPUT;
        res.textContent = ok ? `${sw} × ${sh} → ${sw * s} × ${sh * s} pixels.` : `At ${s}× this picture would be over ${KS.ai.MAX_OUTPUT} pixels wide. Choose 2× or crop it first.`;
        go.disabled = !ok;
      };
      const go = btn('Upscale', async () => {
        d.close();
        KS.ai.setEngine(eng.value);
        const s = Number(scaleSel.value);
        const job = task('AI upscale', `${sw} × ${sh} → ${sw * s} × ${sh * s}. The first run loads the AI model.`);
        try {
          const cv = await KS.ai.upscale(src, { scale: s, quality: qSel.value, signal: job.signal, onProgress: (p, m) => job.progress(p, m) });
          job.progress(1, 'Saving…');
          const id = await canvasToAsset(cv);
          if (!item.originalAssetId) item.originalAssetId = item.assetId;
          item.assetId = id; item.srcW = cv.width; item.srcH = cv.height;
          item.upscaled = (item.upscaled || 1) * s;
          if (KS.project.mode === 'photo' && KS.project.clips[0] === item) KS.app.setPhotoCanvas(KS.project.canvas.w * s, KS.project.canvas.h * s);
          KS.renderer.prepCache = {}; KS.renderer.cutCache = {};
          KS.commit(); KS.requestRender(); KS.emit('refresh-inspector'); KS.emit('layers');
          job.close();
          KS.toast(`Upscaled to ${cv.width} × ${cv.height} on the ${KS.ai.engineLabel()}. Hold “Compare” to see the original.`, 6000);
        } catch (e) {
          if (job.signal.aborted || (e && e.name === 'AbortError')) { KS.toast('Upscale cancelled.'); return; }
          console.error(e);
          job.fail(e.message || String(e));
        }
      }, 'btn primary');
      scaleSel.addEventListener('change', upd);
      d.append(h('div', { class: 'dlg-actions' }, btn('Cancel', () => d.close()), go));
      upd();
      d.showModal();
    },

    revertOriginal(item) {
      if (!item.originalAssetId) return;
      const img = KS.assets[item.originalAssetId] && KS.assets[item.originalAssetId].img;
      if (!img) return;
      const f = item.upscaled || 1;
      item.assetId = item.originalAssetId; item.originalAssetId = null; item.upscaled = 0;
      item.srcW = img.naturalWidth; item.srcH = img.naturalHeight;
      if (KS.project.mode === 'photo' && KS.project.clips[0] === item && f > 1) KS.app.setPhotoCanvas(KS.project.canvas.w / f, KS.project.canvas.h / f);
      KS.renderer.prepCache = {}; KS.renderer.cutCache = {};
      KS.commit(); KS.requestRender(); KS.emit('refresh-inspector');
      KS.toast('Back to the original picture.');
    },

    /* ---------- AI background removal ---------- */
    async removeBg(item) {
      if (item.kind === 'video') {
        item.cutout.ai = true;
        KS.commit(); KS.requestRender(); KS.emit('refresh-inspector');
        const job = task('Remove background', 'Loading the AI model. After that, the background is removed live on every frame.');
        try { job.progress(0.3, 'Loading…'); await KS.ai.loadSeg(); job.close(); KS.toast('Background removed. The preview may lag a little; the export is exact.', 5000); }
        catch (e) { item.cutout.ai = false; KS.commit(); KS.emit('refresh-inspector'); job.fail(e.message); }
        return;
      }
      const src = rawSource(item);
      if (!src) { KS.toast('This needs a photo or a video.'); return; }
      const job = task('Remove background', 'Finding the people in the picture…');
      try {
        job.progress(0.15, 'Loading the AI model…');
        const mask = await KS.ai.personMask(src, 1024);
        job.progress(0.9, 'Saving…');
        const id = await canvasToAsset(mask, true);
        item.cutout.ai = true; item.cutout.maskId = id;
        if (item.backdrop && item.backdrop.type === 'none' && KS.project.mode === 'video') item.backdrop.type = 'blur';
        KS.renderer.cutCache = {};
        KS.commit(); KS.requestRender(); KS.emit('refresh-inspector');
        job.close();
        KS.emit('focus-section', 'Cut-out');
        KS.toast('Background removed. Use “Refine with brush” to fix any edges.', 5000);
      } catch (e) {
        if (job.signal.aborted) return;
        console.error(e);
        job.fail(e.message || String(e));
      }
    },

    /* ---------- refine brush (photos) ---------- */
    refine(item) {
      const src = rawSource(item);
      if (!src || item.kind !== 'image') { KS.toast('The brush works on photos and pictures.'); return; }
      const [sw, sh] = dims(src);
      const k = Math.min(1, 1024 / Math.max(sw, sh));
      const mw = Math.max(2, Math.round(sw * k)), mh = Math.max(2, Math.round(sh * k));
      const mask = document.createElement('canvas');
      mask.width = mw; mask.height = mh;
      const mx = mask.getContext('2d');
      const existing = item.cutout.maskId && KS.assets[item.cutout.maskId];
      if (existing) mx.drawImage(existing.img, 0, 0, mw, mh);
      else { mx.fillStyle = '#fff'; mx.fillRect(0, 0, mw, mh); }
      const undo = [];
      const d = dialog('refineDlg', 'Refine the cut-out', true);
      d.append(h('p', { class: 'dlg-note', text: 'Paint with Erase to remove more, or Restore to bring parts back. The checkerboard shows what is removed.' }));
      const cv = h('canvas', { class: 'crop-cv refine-cv' });
      const wrap = h('div', { class: 'crop-wrap' }, cv);
      d.append(wrap);
      let mode = 'erase', size = 40, soft = 0.5, showRed = false;
      const modeRow = h('div', { class: 'chip-row' });
      const setMode = (m) => { mode = m; modeRow.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === m)); };
      [['erase', 'Erase'], ['restore', 'Restore']].forEach(([m, l]) => { const b = btn(l, () => setMode(m), 'chip'); b.dataset.m = m; modeRow.append(b); });
      const sizeIn = h('input', { type: 'range', min: 4, max: 200, value: size, 'aria-label': 'Brush size' });
      sizeIn.addEventListener('input', () => { size = Number(sizeIn.value); });
      const softIn = h('input', { type: 'range', min: 0, max: 100, value: soft * 100, 'aria-label': 'Brush softness' });
      softIn.addEventListener('input', () => { soft = Number(softIn.value) / 100; });
      const red = h('input', { type: 'checkbox' });
      red.addEventListener('change', () => { showRed = red.checked; draw(); });
      d.append(h('div', { class: 'crop-tools' }, modeRow,
        h('div', { class: 'crop-row' }, h('label', { class: 'crop-straighten' }, 'Size ', sizeIn), h('label', { class: 'crop-straighten' }, 'Softness ', softIn),
          h('label', { class: 'check-inline' }, red, ' Show removed area in red'))));
      d.append(h('div', { class: 'dlg-actions' },
        btn('Undo stroke', () => { const u = undo.pop(); if (u) { mx.globalCompositeOperation = 'copy'; mx.drawImage(u, 0, 0); mx.globalCompositeOperation = 'source-over'; draw(); } }),
        btn('Remove nothing', () => { snap(); mx.globalCompositeOperation = 'source-over'; mx.fillStyle = '#fff'; mx.fillRect(0, 0, mw, mh); draw(); }),
        btn('Cancel', () => d.close()),
        btn('Apply', async () => {
          const id = await canvasToAsset(mask, true);
          item.cutout.ai = true; item.cutout.maskId = id;
          if (item.cutout.threshold > 0.5) item.cutout.threshold = 0.5;
          KS.renderer.cutCache = {};
          KS.commit(); KS.requestRender(); KS.emit('refresh-inspector');
          d.close();
          KS.toast('Cut-out updated.');
        }, 'btn primary')));
      setMode('erase');
      const snap = () => { const u = document.createElement('canvas'); u.width = mw; u.height = mh; u.getContext('2d').drawImage(mask, 0, 0); undo.push(u); if (undo.length > 25) undo.shift(); };
      let scale = 1, W = 0, H = 0;
      const checker = (() => {
        const c = document.createElement('canvas'); c.width = 16; c.height = 16;
        const x = c.getContext('2d'); x.fillStyle = '#ccc'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#888'; x.fillRect(0, 0, 8, 8); x.fillRect(8, 8, 8, 8);
        return c;
      })();
      const comp = document.createElement('canvas');
      const draw = () => {
        const box = wrap.getBoundingClientRect();
        scale = Math.min(Math.max(200, box.width || 700) / sw, Math.min(window.innerHeight * 0.58, 560) / sh);
        W = Math.round(sw * scale); H = Math.round(sh * scale);
        const dpr = window.devicePixelRatio || 1;
        if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
        const x = cv.getContext('2d');
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        x.fillStyle = x.createPattern(checker, 'repeat'); x.fillRect(0, 0, W, H);
        if (comp.width !== W) { comp.width = W; comp.height = H; }
        const c2 = comp.getContext('2d');
        c2.globalCompositeOperation = 'source-over'; c2.clearRect(0, 0, W, H);
        c2.drawImage(src, 0, 0, W, H);
        c2.globalCompositeOperation = 'destination-in';
        c2.drawImage(mask, 0, 0, W, H);
        if (showRed) {
          x.globalAlpha = 0.45; x.drawImage(src, 0, 0, W, H); x.globalAlpha = 1;
          x.fillStyle = 'rgba(255,40,40,.35)'; x.fillRect(0, 0, W, H);
        }
        x.drawImage(comp, 0, 0);
      };
      let painting = false, last = null;
      const paint = (e) => {
        const r = cv.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * mw, py = ((e.clientY - r.top) / r.height) * mh;
        const rad = (size / 2) * (mw / r.width);
        const pts = [];
        if (last) { const dist = Math.hypot(px - last[0], py - last[1]), n = Math.max(1, Math.ceil(dist / (rad * 0.3))); for (let i = 1; i <= n; i++) pts.push([last[0] + ((px - last[0]) * i) / n, last[1] + ((py - last[1]) * i) / n]); }
        else pts.push([px, py]);
        mx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
        for (const [x, y] of pts) {
          const g = mx.createRadialGradient(x, y, rad * (1 - soft * 0.9), x, y, rad);
          g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          mx.fillStyle = g;
          mx.beginPath(); mx.arc(x, y, rad, 0, Math.PI * 2); mx.fill();
        }
        mx.globalCompositeOperation = 'source-over';
        last = [px, py];
        draw();
      };
      cv.addEventListener('pointerdown', (e) => { painting = true; last = null; snap(); cv.setPointerCapture(e.pointerId); paint(e); });
      cv.addEventListener('pointermove', (e) => { if (painting) paint(e); });
      cv.addEventListener('pointerup', () => { painting = false; last = null; });
      d.showModal();
      requestAnimationFrame(draw);
    },

    /* ---------- one-tap colour fix ---------- */
    autoEnhance(C) {
      const src = rawSource(C);
      if (!src) { KS.toast('Auto enhance needs a photo or video under the playhead.'); return; }
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(src, 0, 0, 64, 64);
      const d = x.getImageData(0, 0, 64, 64).data;
      const lum = [];
      let sat = 0, rs = 0, bs = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        lum.push(0.299 * r + 0.587 * g + 0.114 * b);
        const mxv = Math.max(r, g, b), mnv = Math.min(r, g, b);
        sat += mxv ? (mxv - mnv) / mxv : 0; rs += r; bs += b;
      }
      lum.sort((a, b) => a - b);
      const n = lum.length, lo = lum[Math.floor(n * 0.02)], hi = lum[Math.floor(n * 0.98)], mid = lum[Math.floor(n / 2)];
      sat /= n;
      const cast = (rs - bs) / n;
      const F = C.filters;
      F.contrast = Math.round(KS.clamp(100 * (0.9 / Math.max(0.2, hi - lo)), 95, 135));
      F.brightness = Math.round(KS.clamp(100 + (0.5 - mid) * 70, 88, 128));
      F.saturate = Math.round(KS.clamp(100 + (0.38 - sat) * 90, 100, 140));
      F.temperature = Math.round(KS.clamp(-cast * 120, -25, 25));
      F.sharpen = Math.max(F.sharpen, 20);
      C.look = 'auto';
      KS.commit(); KS.requestRender(); KS.emit('refresh-inspector');
      KS.toast('Auto enhance applied. Fine-tune it under Adjustments.');
    },

    /* ---------- stickers ---------- */
    EMOJI: {
      Smileys: '😀 😂 🥹 😍 🥰 😎 🤩 🥳 😜 🤔 😴 😭 😡 🤯 😱 🤗 🙄 😇 🤠 👻 💀 🤖 👽 🙈',
      Love: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💖 💘 💝 💕 💞 💌 😘 🌹 💐 💍',
      Party: '🎉 🎊 🎂 🎁 🎈 🥂 🍾 🎆 🎇 ✨ 🌟 ⭐ 🔥 💥 💯 🏆 🥇 👑',
      Hands: '👍 👎 👏 🙌 🙏 👌 ✌️ 🤞 🤟 🤘 👋 💪 ☝️ 👉 👈 👇 🫶 ✍️',
      Travel: '✈️ 🚗 🏍️ 🚲 🏖️ 🏝️ ⛰️ 🏕️ 🗺️ 🧳 📸 🎥 🌍 🗼 🕌 🛕 🎢 🚀',
      Food: '🍕 🍔 🍟 🌮 🍜 🍣 🍩 🍰 🍦 🍫 ☕ 🧋 🥤 🍉 🍓 🥭 🍌 🍿',
      Nature: '☀️ 🌙 🌈 ⛅ 🌧️ ❄️ 🌊 🌸 🌻 🍀 🌴 🐶 🐱 🦁 🐼 🦋 🐦 🐬',
      Symbols: '✅ ❌ ⚠️ ❓ ❗ 💡 📌 📍 🔔 🎵 🎶 💬 💭 🔴 🟢 🔵 ⬆️ ➡️',
    },
    SHAPES: [
      ['heart', 'Heart'], ['star', 'Star'], ['circle', 'Circle'], ['arrow', 'Arrow'], ['bubble', 'Speech bubble'],
      ['burst', 'Burst'], ['ring', 'Ring'], ['check', 'Tick'],
    ],
    stickers() {
      const d = dialog('stickerDlg', 'Stickers and emoji', true);
      d.append(h('p', { class: 'dlg-note', text: 'Pick one to place it on top of your picture or video. Drag it on the stage to move it; scroll the mouse wheel over it to resize.' }));
      const tabs = h('div', { class: 'chip-row' });
      const grid = h('div', { class: 'sticker-grid' });
      const col = h('input', { type: 'color', value: '#f44336', 'aria-label': 'Shape colour' });
      const show = (name) => {
        tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === name));
        grid.innerHTML = '';
        if (name === 'Shapes') {
          T.SHAPES.forEach(([id, label]) => {
            const c = T.shapeCanvas(id, col.value, 72);
            const b = h('button', { type: 'button', class: 'sticker', title: label, 'aria-label': label }, c);
            b.addEventListener('click', () => { d.close(); T.addSticker(T.shapeCanvas(id, col.value, 512), label); });
            grid.append(b);
          });
          return;
        }
        T.EMOJI[name].split(' ').forEach((em) => {
          const b = h('button', { type: 'button', class: 'sticker emoji', 'aria-label': em }, em);
          b.addEventListener('click', () => { d.close(); T.addSticker(T.emojiCanvas(em, 512), 'Sticker ' + em); });
          grid.append(b);
        });
      };
      [...Object.keys(T.EMOJI), 'Shapes'].forEach((n) => { const b = btn(n, () => show(n), 'chip'); b.dataset.t = n; tabs.append(b); });
      col.addEventListener('input', () => { if (tabs.querySelector('.on').dataset.t === 'Shapes') show('Shapes'); });
      d.append(tabs, grid, h('div', { class: 'dlg-actions sticker-actions' }, h('label', { class: 'check-inline' }, 'Shape colour ', col), btn('Close', () => d.close())));
      show('Smileys');
      d.showModal();
    },
    emojiCanvas(em, size) {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const x = c.getContext('2d');
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `${Math.round(size * 0.82)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif`;
      x.fillText(em, size / 2, size * 0.54);
      return c;
    },
    shapeCanvas(id, color, size) {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const x = c.getContext('2d');
      const s = size, m = s / 2;
      x.fillStyle = color; x.strokeStyle = color; x.lineJoin = 'round'; x.lineCap = 'round';
      x.beginPath();
      if (id === 'heart') {
        x.moveTo(m, s * 0.86);
        x.bezierCurveTo(s * 0.08, s * 0.5, s * 0.12, s * 0.12, m, s * 0.3);
        x.bezierCurveTo(s * 0.88, s * 0.12, s * 0.92, s * 0.5, m, s * 0.86);
        x.fill();
      } else if (id === 'star' || id === 'burst') {
        const n = id === 'star' ? 5 : 14, r1 = s * 0.46, r2 = id === 'star' ? s * 0.19 : s * 0.34;
        for (let i = 0; i < n * 2; i++) {
          const a = (Math.PI * i) / n - Math.PI / 2, r = i % 2 ? r2 : r1;
          x.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r * (id === 'star' ? 1 : 1));
        }
        x.closePath(); x.fill();
      } else if (id === 'circle') { x.arc(m, m, s * 0.44, 0, Math.PI * 2); x.fill(); }
      else if (id === 'ring') { x.lineWidth = s * 0.08; x.arc(m, m, s * 0.4, 0, Math.PI * 2); x.stroke(); }
      else if (id === 'arrow') {
        x.moveTo(s * 0.08, s * 0.4); x.lineTo(s * 0.56, s * 0.4); x.lineTo(s * 0.56, s * 0.2); x.lineTo(s * 0.94, m);
        x.lineTo(s * 0.56, s * 0.8); x.lineTo(s * 0.56, s * 0.6); x.lineTo(s * 0.08, s * 0.6); x.closePath(); x.fill();
      } else if (id === 'bubble') {
        if (x.roundRect) x.roundRect(s * 0.06, s * 0.1, s * 0.88, s * 0.6, s * 0.14); else x.rect(s * 0.06, s * 0.1, s * 0.88, s * 0.6);
        x.fill();
        x.beginPath(); x.moveTo(s * 0.28, s * 0.66); x.lineTo(s * 0.22, s * 0.92); x.lineTo(s * 0.5, s * 0.68); x.fill();
      } else if (id === 'check') {
        x.lineWidth = s * 0.13;
        x.moveTo(s * 0.16, s * 0.52); x.lineTo(s * 0.4, s * 0.76); x.lineTo(s * 0.86, s * 0.26); x.stroke();
      }
      return c;
    },
    async addSticker(cv, name) {
      const id = await canvasToAsset(cv, true);
      const P = KS.project, pl = KS.player;
      const D = pl.duration;
      const start = KS.isPhoto() ? 0 : (pl.t < D - 0.3 ? Math.round(pl.t * 1000) / 1000 : 0);
      const O = KS.defaultOverlay({
        name, kind: 'image', assetId: id, srcW: cv.width, srcH: cv.height, sticker: true,
        x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.5 + (Math.random() - 0.5) * 0.2, width: 0.16 * Math.min(1, P.canvas.h / P.canvas.w * 1.4),
        start, end: KS.isPhoto() ? D : Math.min(D, start + 3),
        anim: KS.merge(KS.defaultAnim(), KS.isPhoto() ? { fadeIn: 0, fadeOut: 0 } : { type: 'zoom-in', ease: 'back', inDur: 0.5, fadeIn: 0.15, fadeOut: 0.3 }),
      });
      if (O.width < 0.08) O.width = 0.12;
      P.overlays.push(O);
      KS.commit(); KS.emit('layers'); KS.select(O.id); KS.requestRender();
      KS.toast('Sticker added. Drag it to place it.');
    },
  });
  void T;
})();
