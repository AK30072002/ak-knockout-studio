/* AK Knockout Studio — compositor
 *
 * Layer order for every frame:
 *   1. the main video track (clips with their looks, motion and transitions) — "the frame"
 *   2. background (colour, gradient, image or blurred video) at its opacity
 *   3. overlays placed below text
 *   4. text layers, in order. A knockout layer shows the frame only inside the letters;
 *      an inverse layer shows it everywhere except the letters.
 *   5. overlays placed above text
 */
(function () {
  'use strict';
  const KS = window.KS;
  const TAU = Math.PI * 2;
  const hasLetterSpacing = 'letterSpacing' in CanvasRenderingContext2D.prototype;
  const smooth = (p) => 0.5 - 0.5 * Math.cos(Math.PI * KS.clamp(p, 0, 1));

  function mk() {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 2;
    return c;
  }

  /* Sharpening uses SVG convolution filters, which canvas can apply through ctx.filter. */
  function installSharpenFilters() {
    if (document.getElementById('ksSharpenDefs')) return;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.id = 'ksSharpenDefs';
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.pointerEvents = 'none';
    svg.setAttribute('aria-hidden', 'true');
    for (let l = 1; l <= 10; l++) {
      const a = (l * 0.1).toFixed(2), c = (1 + 4 * l * 0.1).toFixed(2);
      const f = document.createElementNS(NS, 'filter');
      f.id = 'ksSharpen' + l;
      f.setAttribute('color-interpolation-filters', 'sRGB');
      const m = document.createElementNS(NS, 'feConvolveMatrix');
      m.setAttribute('order', '3');
      m.setAttribute('preserveAlpha', 'true');
      m.setAttribute('kernelMatrix', `0 -${a} 0 -${a} ${c} -${a} 0 -${a} 0`);
      f.append(m);
      svg.append(f);
    }
    document.body.append(svg);
  }

  /* GPU sharpening (unsharp 3x3 kernel). Much faster than the SVG filter, which stays as a fallback. */
  const GL = {
    ready: null,
    init() {
      if (this.ready !== null) return this.ready;
      this.ready = false;
      try {
        const cv = document.createElement('canvas');
        const gl = cv.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
        if (!gl) return false;
        const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}';
        const fs = 'precision mediump float;varying vec2 uv;uniform sampler2D t;uniform vec2 px;uniform float a;' +
          'void main(){vec4 c=texture2D(t,uv);vec4 n=texture2D(t,uv+vec2(px.x,0.))+texture2D(t,uv-vec2(px.x,0.))+texture2D(t,uv+vec2(0.,px.y))+texture2D(t,uv-vec2(0.,px.y));' +
          'gl_FragColor=vec4(clamp(c.rgb*(1.+4.*a)-n.rgb*a,0.,1.),c.a);}';
        const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error('shader'); return x; };
        const prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
        [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST));
        Object.assign(this, { cv, gl, px: gl.getUniformLocation(prog, 'px'), a: gl.getUniformLocation(prog, 'a') });
        this.ready = true;
      } catch (e) { this.ready = false; }
      return this.ready;
    },
    /* Sharpens canvas `target` in place. amount 0..100. */
    apply(target, amount) {
      const { gl, cv } = this;
      if (cv.width !== target.width || cv.height !== target.height) { cv.width = target.width; cv.height = target.height; }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, target);
      gl.uniform2f(this.px, 1 / cv.width, 1 / cv.height);
      gl.uniform1f(this.a, (amount / 100) * 1.2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const c = target.getContext('2d');
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'copy'; c.globalAlpha = 1; c.filter = 'none';
      c.drawImage(cv, 0, 0);
      c.restore();
    },
  };
  KS.gpuSharpen = GL;

  KS.TRANSITIONS = [
    ['none', 'None (cut)'], ['fade', 'Cross dissolve'], ['black', 'Dip to black'], ['white', 'Flash (dip to white)'],
    ['slide-left', 'Push left'], ['slide-right', 'Push right'], ['slide-up', 'Push up'], ['slide-down', 'Push down'],
    ['wipe-left', 'Wipe left'], ['wipe-right', 'Wipe right'], ['circle', 'Circle reveal'], ['zoom', 'Zoom'], ['blur', 'Blur'],
  ];
  KS.MOTIONS = [
    ['none', 'None'], ['zoom-in', 'Slow zoom in (Ken Burns)'], ['zoom-out', 'Slow zoom out'],
    ['pan-left', 'Pan left'], ['pan-right', 'Pan right'], ['pan-up', 'Pan up'], ['pan-down', 'Pan down'],
  ];

  /* Collage layouts: for each photo count, a list of layouts; each is one [x, y, w, h] (0..1) per photo. */
  const grid = (cols, rows, n) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push([(i % cols) / cols, Math.floor(i / cols) / rows, 1 / cols, 1 / rows]);
    return out;
  };
  const LAYOUTS = {
    1: [[[0, 0, 1, 1]]],
    2: [
      [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
      [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]],
      [[0, 0, 0.62, 1], [0.62, 0, 0.38, 1]],
      [[0, 0, 1, 0.62], [0, 0.62, 1, 0.38]],
    ],
    3: [
      [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
      [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
      [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
      [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]],
      [[0, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0, 0.5, 1]],
    ],
    4: [
      grid(2, 2, 4),
      [[0, 0, 1, 0.6], [0, 0.6, 1 / 3, 0.4], [1 / 3, 0.6, 1 / 3, 0.4], [2 / 3, 0.6, 1 / 3, 0.4]],
      [[0, 0, 0.6, 1], [0.6, 0, 0.4, 1 / 3], [0.6, 1 / 3, 0.4, 1 / 3], [0.6, 2 / 3, 0.4, 1 / 3]],
      grid(4, 1, 4), grid(1, 4, 4),
    ],
    5: [
      [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1 / 3, 0.5], [1 / 3, 0.5, 1 / 3, 0.5], [2 / 3, 0.5, 1 / 3, 0.5]],
      [[0, 0, 0.6, 0.6], [0.6, 0, 0.4, 0.3], [0.6, 0.3, 0.4, 0.3], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]],
      [[0, 0, 1 / 3, 0.5], [1 / 3, 0, 1 / 3, 0.5], [2 / 3, 0, 1 / 3, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    ],
    6: [grid(3, 2, 6), grid(2, 3, 6),
      [[0, 0, 2 / 3, 2 / 3], [2 / 3, 0, 1 / 3, 1 / 3], [2 / 3, 1 / 3, 1 / 3, 1 / 3], [0, 2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 1 / 3, 1 / 3], [2 / 3, 2 / 3, 1 / 3, 1 / 3]]],
    7: [[[0, 0, 1, 0.4], ...grid(3, 2, 6).map(([x, y, w, h]) => [x, 0.4 + y * 0.6, w, h * 0.6])]],
    8: [grid(4, 2, 8), grid(2, 4, 8)],
    9: [grid(3, 3, 9)],
  };
  KS.collageLayouts = (n) => {
    n = KS.clamp(n, 1, 9);
    return LAYOUTS[n];
  };
  KS.COLLAGE_MAX = 9;

  const STILL_ANIM = { type: 'none', timing: 'duration', repeats: 1, speed: 0, loop: false, ease: 'linear', inDur: 0, freq: 0, amount: 0, gap: 0, reverse: false, fadeIn: 0, fadeOut: 0 };

  const R = (KS.renderer = {
    boxes: {},
    pendingFonts: new Set(),
    extraSharpen: 0, // added to every clip during export when "Enhance sharpness" is on
    transparent: false, // photo export with a see-through background
    compare: null, // id of a clip shown as its unedited original ("hold to compare")
    override: {}, // assetId -> canvas: AI-upscaled pictures used during a photo export
    exportMasks: {}, // owner -> mask canvas computed for the exact export frame
    prepCache: {}, cutCache: {}, cellBoxes: {}, cells: [],

    init(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.frame = mk(); this.fctx = this.frame.getContext('2d');
      this.layer = mk(); this.lctx = this.layer.getContext('2d');
      this.block = mk(); this.bctx = this.block.getContext('2d');
      this.demo = mk(); this.dctx = this.demo.getContext('2d');
      this.clipA = mk(); this.clipB = mk();
      this.key = mk(); this.kctx = this.key.getContext('2d', { willReadFrequently: true });
      this.keyCache = {};
      this.liveKeys = {};
      this.noise = mk(); this.noise.width = 256; this.noise.height = 256;
      const nc = this.noise.getContext('2d'), id = nc.createImageData(256, 256);
      for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      nc.putImageData(id, 0, 0);
      installSharpenFilters();
    },

    setSize(w, h) {
      for (const c of [this.cv, this.frame, this.layer, this.clipA, this.clipB]) {
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      }
      const dw = Math.max(2, Math.round(w / 2)), dh = Math.max(2, Math.round(h / 2));
      if (this.demo.width !== dw || this.demo.height !== dh) { this.demo.width = dw; this.demo.height = dh; }
    },

    render(t) {
      const P = KS.project;
      const W = this.cv.width, H = this.cv.height;
      const k = Math.min(W, H) / 1080;
      this.drawSourceFrame(t, W, H, k);

      const c = this.ctx;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      if (this.transparent) c.clearRect(0, 0, W, H);
      else { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
      c.drawImage(this.frame, 0, 0);
      this.drawBackground(c, W, H, k);
      this.boxes = {};
      // a photo has no time: every layer is shown fully, without its animation
      const still = KS.isPhoto();
      const fix = (L) => (still ? { ...L, start: -1, end: 1e9, anim: STILL_ANIM } : L);
      const tt = still ? 0 : t;
      for (const O of P.overlays) if (!O.above) this.drawOverlay(c, fix(O), tt, W, H, k);
      for (const L of P.texts) this.drawTextLayer(c, fix(L), tt, W, H, k);
      for (const O of P.overlays) if (O.above) this.drawOverlay(c, fix(O), tt, W, H, k);
      c.restore();
    },

    /* ---------- the main video track ---------- */
    filterString(fl, k, extraSharpen = 0) {
      const parts = [];
      if (fl.brightness !== 100) parts.push(`brightness(${fl.brightness}%)`);
      if (fl.contrast !== 100) parts.push(`contrast(${fl.contrast}%)`);
      if (fl.saturate !== 100) parts.push(`saturate(${fl.saturate}%)`);
      if (fl.hue) parts.push(`hue-rotate(${fl.hue}deg)`);
      if (fl.blur) parts.push(`blur(${(fl.blur * k).toFixed(2)}px)`);
      if (fl.grayscale) parts.push(`grayscale(${fl.grayscale}%)`);
      if (fl.sepia) parts.push(`sepia(${fl.sepia}%)`);
      if (fl.invert) parts.push(`invert(${fl.invert}%)`);
      const sh = Math.round(KS.clamp((fl.sharpen || 0) + extraSharpen, 0, 100) / 10);
      if (sh > 0 && !GL.init()) parts.push(`url(#ksSharpen${sh})`); // GPU path handles it otherwise
      return parts.length ? parts.join(' ') : 'none';
    },

    drawDemo(t) {
      const d = this.dctx, w = this.demo.width, h = this.demo.height;
      const hue = (t * 24) % 360;
      const g = d.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hue},80%,52%)`);
      g.addColorStop(0.5, `hsl(${(hue + 50) % 360},85%,48%)`);
      g.addColorStop(1, `hsl(${(hue + 130) % 360},80%,55%)`);
      d.fillStyle = g;
      d.fillRect(0, 0, w, h);
      const m = Math.min(w, h);
      for (let i = 0; i < 7; i++) {
        const x = w * (0.5 + 0.42 * Math.sin(t * 0.6 + i * 1.7));
        const y = h * (0.5 + 0.4 * Math.cos(t * 0.45 + i * 2.3));
        const r = m * (0.22 + 0.08 * Math.sin(t + i));
        const rg = d.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, i % 2 ? 'rgba(244,67,54,0.95)' : 'rgba(139,195,74,0.95)');
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = rg;
        d.beginPath(); d.arc(x, y, r, 0, TAU); d.fill();
      }
      d.save();
      d.globalAlpha = 0.16;
      d.fillStyle = '#fff';
      d.translate(w / 2, h / 2);
      d.rotate(-0.5);
      const sp = Math.max(w, h) / 14, off = (t * sp * 0.8) % (sp * 2), big = Math.hypot(w, h);
      for (let x = -big - off; x < big; x += sp * 2) d.fillRect(x, -big, sp, big * 2);
      d.restore();
    },

    /* Source image for a clip at time t: { src, sw, sh, live } or a placeholder message. */
    clipSource(e, t) {
      const c = e.clip;
      if (c.kind === 'video') {
        const pe = KS.pool.get(c.id, c.mediaId);
        if (!pe) return { missing: `Media offline: ${c.mediaName || c.name}` };
        const v = pe.el;
        if (v.readyState >= 2 && v.videoWidth) return { src: v, sw: v.videoWidth, sh: v.videoHeight, live: true };
        return { loading: true };
      }
      if (c.kind === 'image') {
        const id = this.compare === c.id && c.originalAssetId ? c.originalAssetId : c.assetId;
        const ov = this.override[id];
        if (ov) return { src: ov, sw: ov.width, sh: ov.height, live: false, key: id + '@x' + ov.width };
        const as = id && KS.assets[id];
        if (as) return { src: as.img, sw: as.img.naturalWidth, sh: as.img.naturalHeight, live: false, key: id };
        return { missing: `Image missing: ${c.name}` };
      }
      if (c.kind === 'color') return { color: c.color };
      this.drawDemo(t - e.start);
      return { src: this.demo, sw: this.demo.width, sh: this.demo.height, live: true };
    },

    /* Crop, quarter turns and straightening, applied to a source. Returns { src, sw, sh }. */
    hasCrop(cr) {
      return !!cr && (cr.rot || cr.angle || cr.x > 1e-4 || cr.y > 1e-4 || cr.w < 0.9999 || cr.h < 0.9999);
    },
    cropSize(cr, sw, sh) {
      const turned = cr.rot === 90 || cr.rot === 270;
      const tw = turned ? sh : sw, th = turned ? sw : sh;
      return { tw, th, w: Math.max(1, Math.round(cr.w * tw)), h: Math.max(1, Math.round(cr.h * th)) };
    },
    prepare(owner, cr, s, cacheKey) {
      if (!this.hasCrop(cr)) return s;
      const key = cacheKey && `${cacheKey}|${cr.x}|${cr.y}|${cr.w}|${cr.h}|${cr.rot}|${cr.angle}`;
      const slot = (this.prepCache[owner] = this.prepCache[owner] || { cv: document.createElement('canvas'), key: null });
      if (key && slot.key === key) return { src: slot.cv, sw: slot.cv.width, sh: slot.cv.height, live: s.live };
      const { tw, th, w, h } = this.cropSize(cr, s.sw, s.sh);
      const cv = slot.cv;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const x = cv.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, w, h);
      const a = ((cr.angle || 0) * Math.PI) / 180, ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const cover = Math.max((tw * ca + th * sa) / tw, (tw * sa + th * ca) / th); // no empty corners when straightening
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.translate(-cr.x * tw + tw / 2, -cr.y * th + th / 2);
      x.rotate(((cr.rot || 0) * Math.PI) / 180 + a);
      x.scale(cover, cover);
      x.drawImage(s.src, -s.sw / 2, -s.sh / 2, s.sw, s.sh);
      slot.key = key;
      return { src: cv, sw: w, sh: h, live: s.live };
    },

    /* Where a clip's picture sits in a W×H frame (framing plus Ken Burns motion). */
    clipGeometry(c, e, t, W, H, sw, sh) {
      let sx, sy;
      const fit = this.compare === c.id ? 'contain' : c.fit;
      if (fit === 'stretch') { sx = W / sw; sy = H / sh; }
      else { sx = sy = fit === 'contain' ? Math.min(W / sw, H / sh) : Math.max(W / sw, H / sh); }
      const m = c.motion || { type: 'none', amount: 1 };
      const p = KS.clamp((t - e.start) / e.len, 0, 1), amt = m.amount;
      let mz = 1, mx = 0, my = 0;
      if (m.type === 'zoom-in') mz = 1 + 0.2 * amt * p;
      else if (m.type === 'zoom-out') mz = 1 + 0.2 * amt * (1 - p);
      else if (m.type !== 'none') {
        mz = 1 + 0.14 * amt;
        const d = 0.06 * amt * (smooth(p) * 2 - 1);
        if (m.type === 'pan-left') mx = -d; else if (m.type === 'pan-right') mx = d;
        else if (m.type === 'pan-up') my = -d; else if (m.type === 'pan-down') my = d;
      }
      return {
        tx: W / 2 + (c.offsetX + mx) * W, ty: H / 2 + (c.offsetY + my) * H,
        rot: (c.rotation * Math.PI) / 180, fx: c.flipH ? -1 : 1, fy: c.flipV ? -1 : 1,
        dw: sw * sx * c.zoom * mz, dh: sh * sy * c.zoom * mz,
      };
    },
    drawPlaced(f, img, g, filter = 'none', grow = 1) {
      f.save();
      f.filter = filter;
      f.translate(g.tx, g.ty);
      if (g.rot) f.rotate(g.rot);
      f.scale(g.fx * grow, g.fy * grow);
      f.drawImage(img, -g.dw / 2, -g.dh / 2, g.dw, g.dh);
      f.restore();
    },

    /* A clip or overlay with its background removed (AI person cut-out and/or a colour key).
       p is the prepared source; maskSrc is the matching raw mask (or null). */
    cutout(item, p, owner, mask, cacheKey) {
      const cu = item.cutout || {}, ch = item.chroma || {};
      const key = cacheKey && `${cacheKey}|${cu.ai}|${cu.maskId}|${cu.threshold}|${cu.feather}|${ch.enabled}|${ch.color}|${ch.tolerance}|${ch.softness}`;
      const slot = (this.cutCache[owner] = this.cutCache[owner] || { cv: document.createElement('canvas'), refined: document.createElement('canvas'), key: null });
      if (key && slot.key === key) return slot.cv;
      const maxW = p.live ? 1280 : 4096;
      const w = Math.max(2, Math.min(maxW, Math.round(p.sw))), h = Math.max(2, Math.round((w * p.sh) / p.sw));
      const cv = slot.cv;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const x = cv.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-over'; x.filter = 'none';
      x.clearRect(0, 0, w, h);
      if (ch.enabled) x.drawImage(this.chromaKey(item, { ...p, ckey: cacheKey }, w), 0, 0, w, h);
      else x.drawImage(p.src, 0, 0, w, h);
      if (cu.ai && mask) {
        const r = KS.ai.refineMask(mask, cu.threshold, slot.refined);
        x.globalCompositeOperation = 'destination-in';
        const fe = (cu.feather || 0) * (w / 1000);
        if (fe > 0.3) x.filter = `blur(${fe.toFixed(1)}px)`;
        x.drawImage(r, 0, 0, w, h);
        x.filter = 'none';
        x.globalCompositeOperation = 'source-over';
      } else if (cu.ai && !mask) {
        x.clearRect(0, 0, w, h); // still working out the first mask
        if (p.live) { slot.key = null; return cv; }
      }
      slot.key = key;
      return cv;
    },

    /* The AI mask that belongs to a clip or overlay at this moment (null when none or not ready). */
    maskFor(item, s, owner) {
      if (!item.cutout || !item.cutout.ai) return null;
      if (s.live) {
        if (!(s.src instanceof HTMLVideoElement)) return null;
        const m = this.exportMasks[owner] || KS.ai.liveMask(owner, s.src);
        return m;
      }
      const as = item.cutout.maskId && KS.assets[item.cutout.maskId];
      return as ? as.img : null;
    },

    drawBackdrop(f, c, g, p, W, H, k) {
      const B = c.backdrop;
      if (!B || B.type === 'none') return;
      f.save();
      if (B.type === 'color') { f.fillStyle = B.color; f.fillRect(0, 0, W, H); }
      else if (B.type === 'gradient') {
        const gr = f.createLinearGradient(0, 0, W, H);
        gr.addColorStop(0, B.gradA); gr.addColorStop(1, B.gradB);
        f.fillStyle = gr; f.fillRect(0, 0, W, H);
      } else if (B.type === 'blur') {
        const fl = this.filterString(c.filters, k, 0);
        this.drawPlaced(f, p.src, g, `${fl === 'none' ? '' : fl + ' '}blur(${(B.blur * k).toFixed(1)}px)`, 1.06);
      } else if (B.type === 'image') {
        const as = B.assetId && KS.assets[B.assetId];
        if (as) {
          const i = as.img, s = Math.max(W / i.naturalWidth, H / i.naturalHeight);
          f.imageSmoothingQuality = 'high';
          f.drawImage(i, (W - i.naturalWidth * s) / 2, (H - i.naturalHeight * s) / 2, i.naturalWidth * s, i.naturalHeight * s);
        }
      }
      f.restore();
    },

    /* Draws one clip, with crop, cut-out, framing, motion and its look, into canvas cv. */
    renderClip(cv, e, t, W, H, k) {
      const c = e.clip, f = cv.getContext('2d');
      const comparing = this.compare === c.id;
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.globalAlpha = 1; f.globalCompositeOperation = 'source-over'; f.filter = 'none';
      if (this.transparent) f.clearRect(0, 0, W, H);
      else { f.fillStyle = '#000'; f.fillRect(0, 0, W, H); }
      const s = this.clipSource(e, t);
      if (s.color) { f.fillStyle = s.color; f.fillRect(0, 0, W, H); }
      else if (s.missing) {
        f.fillStyle = '#2a2b30'; f.fillRect(0, 0, W, H);
        f.fillStyle = '#a3a4ab'; f.textAlign = 'center'; f.textBaseline = 'middle';
        f.font = `600 ${Math.round(40 * k)}px system-ui, sans-serif`;
        f.fillText(s.missing, W / 2, H / 2);
        return;
      } else if (s.src) {
        const p = comparing ? s : this.prepare(c.id, c.crop, s, s.key);
        const g = this.clipGeometry(c, e, t, W, H, p.sw, p.sh);
        f.imageSmoothingEnabled = true;
        f.imageSmoothingQuality = 'high';
        const fl = comparing ? 'none' : this.filterString(c.filters, k, this.extraSharpen);
        const cut = !comparing && ((c.cutout && c.cutout.ai) || (c.chroma && c.chroma.enabled));
        let subject = p.src;
        if (cut) {
          let mask = this.maskFor(c, s, c.id);
          if (mask && this.hasCrop(c.crop)) {
            const ms = { src: mask, sw: mask.naturalWidth || mask.width, sh: mask.naturalHeight || mask.height, live: s.live };
            mask = this.prepare(c.id + ':mask', c.crop, ms, !s.live && c.cutout.maskId).src;
          }
          subject = this.cutout(c, p, c.id, mask, !s.live && p === s ? s.key : !s.live && s.key + JSON.stringify(c.crop));
          this.drawBackdrop(f, c, g, p, W, H, k);
        }
        this.drawPlaced(f, subject, g, fl);
        if (!comparing) {
          const sharp = KS.clamp((c.filters.sharpen || 0) + this.extraSharpen, 0, 100);
          if (sharp > 0 && GL.init()) GL.apply(cv, sharp);
          this.applyLook(f, c.filters, t, W, H);
          // keep the cut-out's transparency when nothing is behind it
          if (cut && (!c.backdrop || c.backdrop.type === 'none')) {
            f.save(); f.globalCompositeOperation = 'destination-in';
            this.drawPlaced(f, subject, g);
            f.restore();
            if (!this.transparent) { f.save(); f.globalCompositeOperation = 'destination-over'; f.fillStyle = '#000'; f.fillRect(0, 0, W, H); f.restore(); }
          }
        }
        return;
      }
      this.applyLook(f, c.filters, t, W, H);
    },

    /* Warmth, vignette and film grain, painted over the clip. */
    applyLook(f, fl, t, W, H) {
      if (fl.temperature) {
        f.save();
        f.globalCompositeOperation = 'soft-light';
        f.globalAlpha = Math.min(1, Math.abs(fl.temperature) / 100) * 0.75;
        f.fillStyle = fl.temperature > 0 ? '#ff8a1f' : '#1f7aff';
        f.fillRect(0, 0, W, H);
        f.restore();
      }
      if (fl.vignette) {
        const r = Math.hypot(W, H) / 2;
        const g = f.createRadialGradient(W / 2, H / 2, r * 0.35, W / 2, H / 2, r);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${(KS.clamp(fl.vignette, 0, 100) / 100) * 0.9})`);
        f.fillStyle = g; f.fillRect(0, 0, W, H);
      }
      if (fl.grain) {
        f.save();
        f.globalCompositeOperation = 'overlay';
        f.globalAlpha = (KS.clamp(fl.grain, 0, 100) / 100) * 0.45;
        const n = Math.floor(t * 24);
        const pat = f.createPattern(this.noise, 'repeat');
        f.translate((n * 97) % 256, (n * 61) % 256);
        f.fillStyle = pat;
        f.fillRect(-256, -256, W + 512, H + 512);
        f.restore();
      }
    },

    drawSourceFrame(t, W, H, k) {
      const f = this.fctx;
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.globalAlpha = 1; f.globalCompositeOperation = 'source-over'; f.filter = 'none';
      if (this.transparent) f.clearRect(0, 0, W, H);
      else { f.fillStyle = '#000'; f.fillRect(0, 0, W, H); }
      if (KS.project.mode === 'collage') { this.drawCollage(f, W, H, k); return; }
      const lay = KS.seq.layout();
      const act = KS.seq.at(t, lay);
      if (!act.length) return;
      if (act.length === 1) { this.renderClip(this.clipA, act[0], t, W, H, k); f.drawImage(this.clipA, 0, 0); return; }
      const A = act[act.length - 2], B = act[act.length - 1];
      this.renderClip(this.clipA, A, t, W, H, k);
      this.renderClip(this.clipB, B, t, W, H, k);
      const type = B.tin > 0 ? B.clip.transition.type : 'none';
      this.composeTransition(f, this.clipA, this.clipB, type, KS.seq.progress(B, t), W, H, k);
    },

    /* Collage: every clip is a photo in its own cell. */
    collageRects(W, H, k) {
      const P = KS.project, C = P.collage;
      const n = P.clips.length;
      const opts = KS.collageLayouts(n);
      const L = opts[((C.layout % opts.length) + opts.length) % opts.length];
      const s = C.spacing * k;
      return L.map((r) => {
        const x0 = s + r[0] * (W - s), y0 = s + r[1] * (H - s);
        const x1 = s + (r[0] + r[2]) * (W - s) - s, y1 = s + (r[1] + r[3]) * (H - s) - s;
        return { x: x0, y: y0, w: Math.max(2, x1 - x0), h: Math.max(2, y1 - y0) };
      });
    },
    drawCollage(f, W, H, k) {
      const P = KS.project, C = P.collage;
      f.fillStyle = C.color; f.fillRect(0, 0, W, H);
      const rects = this.collageRects(W, H, k);
      this.cellBoxes = {};
      P.clips.forEach((clip, i) => {
        const r = rects[i];
        if (!r) return;
        this.cellBoxes[clip.id] = r;
        const cw = Math.max(2, Math.round(r.w)), ch = Math.max(2, Math.round(r.h));
        const cell = (this.cells[i] = this.cells[i] || document.createElement('canvas'));
        if (cell.width !== cw || cell.height !== ch) { cell.width = cw; cell.height = ch; }
        const was = this.transparent;
        this.transparent = true;
        this.renderClip(cell, { clip, start: 0, end: 1, len: 1, tin: 0, index: i }, 0, cw, ch, k);
        this.transparent = was;
        const rad = (KS.clamp(C.radius, 0, 100) / 100) * (Math.min(r.w, r.h) / 2);
        f.save();
        f.beginPath();
        if (f.roundRect) f.roundRect(r.x, r.y, r.w, r.h, rad); else f.rect(r.x, r.y, r.w, r.h);
        f.clip();
        f.drawImage(cell, r.x, r.y, r.w, r.h);
        f.restore();
      });
    },

    composeTransition(f, a, b, type, p, W, H, k) {
      const e = smooth(p);
      const draw = (img, alpha = 1, dx = 0, dy = 0, s = 1) => {
        f.save();
        f.globalAlpha = alpha;
        f.translate(W / 2 + dx, H / 2 + dy);
        f.scale(s, s);
        f.drawImage(img, -W / 2, -H / 2);
        f.restore();
      };
      switch (type) {
        case 'fade': draw(a); draw(b, p); break;
        case 'black': case 'white': {
          const col = type === 'black' ? '#000' : '#fff';
          draw(p < 0.5 ? a : b);
          f.save(); f.globalAlpha = p < 0.5 ? p * 2 : (1 - p) * 2; f.fillStyle = col; f.fillRect(0, 0, W, H); f.restore();
          break;
        }
        case 'slide-left': draw(a, 1, -e * W); draw(b, 1, (1 - e) * W); break;
        case 'slide-right': draw(a, 1, e * W); draw(b, 1, -(1 - e) * W); break;
        case 'slide-up': draw(a, 1, 0, -e * H); draw(b, 1, 0, (1 - e) * H); break;
        case 'slide-down': draw(a, 1, 0, e * H); draw(b, 1, 0, -(1 - e) * H); break;
        case 'wipe-left': case 'wipe-right': case 'circle': {
          draw(a);
          f.save(); f.beginPath();
          if (type === 'wipe-left') f.rect(W * (1 - e), 0, W * e + 1, H);
          else if (type === 'wipe-right') f.rect(0, 0, W * e, H);
          else f.arc(W / 2, H / 2, (e * Math.hypot(W, H)) / 2, 0, TAU);
          f.clip(); draw(b); f.restore();
          break;
        }
        case 'zoom': draw(a, 1 - e, 0, 0, 1 + e * 0.6); draw(b, e, 0, 0, 0.7 + 0.3 * e); break;
        case 'blur':
          f.save(); f.filter = `blur(${(e * 24 * k).toFixed(1)}px)`; draw(a, 1); f.restore();
          f.save(); f.filter = `blur(${((1 - e) * 24 * k).toFixed(1)}px)`; draw(b, e); f.restore();
          break;
        default: draw(b); break;
      }
    },

    /* ---------- background ---------- */
    drawFit(c, img, W, H, fit) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (fit === 'stretch') { c.drawImage(img, 0, 0, W, H); return; }
      if (fit === 'tile') {
        const pat = c.createPattern(img, 'repeat');
        c.fillStyle = pat; c.fillRect(0, 0, W, H); return;
      }
      const s = fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
      c.drawImage(img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    },

    drawBackground(c, W, H, k) {
      const B = KS.project.background;
      if (B.type === 'none' || B.opacity <= 0) return;
      c.save();
      c.globalAlpha = B.opacity;
      if (B.type === 'color') {
        c.fillStyle = B.color; c.fillRect(0, 0, W, H);
      } else if (B.type === 'gradient') {
        let g;
        if (B.gradKind === 'radial') {
          g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
        } else {
          const a = (B.gradAngle * Math.PI) / 180, r = Math.hypot(W, H) / 2;
          const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
          g = c.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
        }
        g.addColorStop(0, B.gradA); g.addColorStop(1, B.gradB);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      } else if (B.type === 'image') {
        c.fillStyle = B.color; c.fillRect(0, 0, W, H);
        const as = B.imageId && KS.assets[B.imageId];
        if (as) this.drawFit(c, as.img, W, H, B.imageFit);
      } else if (B.type === 'video-blur') {
        const m = B.blurAmount * k * 2;
        c.filter = `blur(${(B.blurAmount * k).toFixed(1)}px)`;
        c.drawImage(this.frame, -m, -m, W + m * 2, H + m * 2);
        c.filter = 'none';
        c.globalAlpha = B.opacity * B.dim;
        c.fillStyle = B.color; c.fillRect(0, 0, W, H);
      }
      c.restore();
    },

    /* ---------- text ---------- */
    fontStr(L, k) {
      return `${L.italic ? 'italic ' : ''}${L.weight} ${Math.max(1, L.size * k).toFixed(1)}px "${L.font}", "Arial Black", sans-serif`;
    },

    setFont(ctx, L, k) {
      const font = this.fontStr(L, k);
      ctx.font = font;
      if (hasLetterSpacing) ctx.letterSpacing = `${(L.letterSpacing * k).toFixed(1)}px`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      if (document.fonts && !this.pendingFonts.has(font) && !document.fonts.check(font)) {
        this.pendingFonts.add(font);
        document.fonts.load(font).then(() => KS.requestRender()).catch(() => {});
      }
    },

    layout(ctx, L, k) {
      const txt = L.uppercase ? L.text.toUpperCase() : L.text;
      const lines = txt.split('\n');
      const widths = lines.map((s) => ctx.measureText(s).width);
      const w = Math.max(1, ...widths);
      const lineH = L.size * k * L.lineHeight;
      const h = Math.max(lineH, lines.length * lineH);
      const nChars = lines.reduce((n, s) => n + Array.from(s).length, 0);
      return { lines, widths, w, h, lineH, nChars };
    },

    paintBlock(c, lay, L, st, how) {
      const { lines, widths, w, h, lineH } = lay;
      const draw = (s, x, y) => (how === 'stroke' ? c.strokeText(s, x, y) : c.fillText(s, x, y));
      if (st.wipe < 1) {
        c.save();
        c.beginPath();
        const pad = lineH;
        c.rect(-w / 2 - pad, -h / 2 - pad, (w + pad * 2) * st.wipe, h + pad * 2);
        c.clip();
      }
      const perChar = !!st.charFn;
      const partial = st.chars !== Infinity;
      let idx = 0;
      const baseA = c.globalAlpha;
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li], lw = widths[li];
        const y = -h / 2 + lineH * (li + 0.5);
        const x0 = L.align === 'left' ? -w / 2 : L.align === 'right' ? w / 2 - lw : -lw / 2;
        const chars = Array.from(line);
        if (!perChar && !partial) { draw(line, x0, y); idx += chars.length; continue; }
        if (!perChar) {
          const n = KS.clamp(st.chars - idx, 0, chars.length);
          if (n > 0) draw(chars.slice(0, n).join(''), x0, y);
          idx += chars.length;
          continue;
        }
        let x = x0;
        for (const ch of chars) {
          if (idx >= st.chars) break;
          const r = st.charFn(idx);
          if (r.alpha > 0) { c.globalAlpha = baseA * r.alpha; draw(ch, x, y + r.dy); }
          x += c.measureText(ch).width;
          idx++;
        }
        c.globalAlpha = baseA;
      }
      if (st.wipe < 1) c.restore();
    },

    drawShape(c, L, lay, st, base, how, W, H) {
      const sw = lay.w * L.scale, sh = lay.h * L.scale;
      const pos = [];
      if (st.tile && st.tile.axis === 'x') {
        for (let left = -st.tile.off, n = 0; left < W && n < 400; left += st.tile.step, n++) pos.push([left + sw / 2, base.cy + st.dy]);
      } else if (st.tile) {
        for (let top = -st.tile.off, n = 0; top < H && n < 400; top += st.tile.step, n++) pos.push([base.cx + st.dx, top + sh / 2]);
      } else {
        pos.push([base.cx + st.dx, base.cy + st.dy]);
      }
      const s = L.scale * st.scale;
      for (const [x, y] of pos) {
        c.save();
        c.translate(x, y);
        c.rotate((L.rotation * Math.PI) / 180 + st.rot);
        c.scale(s, s);
        this.paintBlock(c, lay, L, st, how);
        c.restore();
      }
    },

    /* Star-wars style crawl: render the block flat, then draw it row by row with perspective. */
    drawCrawl(c, L, lay, st, base, how, style, k, W, H) {
      const pad = Math.ceil(lay.lineH * 0.5);
      const bw = Math.ceil(lay.w * L.scale + pad * 2), bh = Math.ceil(lay.h * L.scale + pad * 2);
      if (this.block.width !== bw || this.block.height !== bh) { this.block.width = bw; this.block.height = bh; }
      const b = this.bctx;
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.clearRect(0, 0, bw, bh);
      this.setFont(b, L, k);
      b.fillStyle = style; b.strokeStyle = style; b.lineWidth = c.lineWidth; b.lineJoin = 'round';
      b.translate(bw / 2, bh / 2);
      b.scale(L.scale, L.scale);
      this.paintBlock(b, lay, L, { ...st, crawl: null }, how);
      b.setTransform(1, 0, 0, 1, 0, 0);

      const horizon = H * 0.1, K = H * 0.9, vmin = 0.2;
      // Widen narrow blocks so the crawl fills the frame near the viewer.
      const f = Math.max(1, (W * 0.8) / bw);
      const uMax = K * (1 / vmin - 1) / f;
      const a = L.anim;
      const p = KS.cycleProgress(a, st.crawl.lt, st.crawl.dur, bh + uMax, a.speed * k);
      const uBottom = -bh + p * (bh + uMax);
      const step = Math.max(1, Math.round(2 * k));
      const baseA = c.globalAlpha;
      const cx = base.cx + st.dx;
      for (let y = horizon; y < H; y += step) {
        const v0 = (y - horizon) / (H - horizon), v1 = (y + step - horizon) / (H - horizon);
        if (v0 < vmin) continue;
        const u0 = K * (1 / v0 - 1), u1 = K * (1 / v1 - 1);
        const sy = bh - (u0 / f - uBottom), sEnd = sy + (u0 - u1) / f;
        const a0 = Math.max(0, sy), a1 = Math.min(bh, sEnd);
        if (a1 <= a0) continue;
        const vm = (v0 + v1) / 2, dw = bw * vm * f;
        c.globalAlpha = baseA * KS.clamp((vm - vmin) * 8, 0, 1);
        c.drawImage(this.block, 0, a0, bw, a1 - a0, cx - dw / 2, y, dw, step);
      }
      c.globalAlpha = baseA;
    },

    drawTextLayer(c, L, t, W, H, k) {
      if (!L.visible) return;
      this.setFont(c, L, k);
      const lay = this.layout(c, L, k);
      const base = { cx: L.x * W, cy: L.y * H };
      const box = {
        cx: base.cx, cy: base.cy, w: lay.w * L.scale, h: lay.h * L.scale,
        lineH: lay.lineH * L.scale, nChars: lay.nChars,
      };
      this.boxes[L.id] = { cx: base.cx, cy: base.cy, w: box.w, h: box.h, rot: (L.rotation * Math.PI) / 180, anim: null };
      const st = KS.computeAnim(L, t, W, H, box, k);
      if (!st || st.alpha <= 0.001) return;
      this.boxes[L.id].anim = { cx: base.cx + st.dx, cy: base.cy + st.dy, s: st.scale, rot: st.rot, special: !!(st.tile || st.crawl) };

      const opacity = L.opacity * st.alpha;
      const strokeW = Math.max(0.5, L.stroke.width * k);
      const paint = (ctx, how, style) => {
        this.setFont(ctx, L, k);
        ctx.fillStyle = style; ctx.strokeStyle = style;
        ctx.lineWidth = strokeW; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
        if (st.crawl) this.drawCrawl(ctx, L, lay, st, base, how, style, k, W, H);
        else this.drawShape(ctx, L, lay, st, base, how, W, H);
      };
      const withShadow = (ctx) => {
        ctx.shadowColor = L.shadow.color;
        ctx.shadowBlur = L.shadow.blur * k;
        ctx.shadowOffsetX = L.shadow.x * k;
        ctx.shadowOffsetY = L.shadow.y * k;
      };
      const lc = this.lctx;
      const resetLayer = () => {
        lc.setTransform(1, 0, 0, 1, 0, 0);
        lc.globalCompositeOperation = 'source-over';
        lc.globalAlpha = 1;
        lc.shadowColor = 'transparent';
        lc.clearRect(0, 0, W, H);
      };

      if (L.mode === 'solid') {
        c.save();
        c.globalAlpha = opacity;
        if (L.shadow.enabled) withShadow(c);
        paint(c, 'fill', L.fill);
        c.restore();
      } else if (L.mode === 'knockout' || L.mode === 'video-outline') {
        const how = L.mode === 'knockout' ? 'fill' : 'stroke';
        if (L.shadow.enabled) {
          c.save(); c.globalAlpha = opacity; withShadow(c); paint(c, how, L.shadow.color); c.restore();
        }
        resetLayer();
        paint(lc, how, '#fff');
        lc.globalCompositeOperation = 'source-in';
        lc.drawImage(this.frame, 0, 0);
        lc.globalCompositeOperation = 'source-over';
        c.save(); c.globalAlpha = opacity; c.drawImage(this.layer, 0, 0); c.restore();
      } else if (L.mode === 'inverse') {
        resetLayer();
        lc.drawImage(this.frame, 0, 0);
        lc.globalCompositeOperation = 'destination-out';
        lc.globalAlpha = st.alpha;
        paint(lc, 'fill', '#fff');
        lc.globalCompositeOperation = 'source-over';
        lc.globalAlpha = 1;
        c.save(); c.globalAlpha = L.opacity; c.drawImage(this.layer, 0, 0); c.restore();
      }

      if (L.stroke.enabled && L.mode !== 'video-outline') {
        c.save(); c.globalAlpha = opacity; paint(c, 'stroke', L.stroke.color); c.restore();
      }
    },

    /* ---------- overlays (picture-in-picture, logos, stickers) ---------- */
    overlaySource(O) {
      if (O.kind === 'video') {
        const pe = KS.pool.get(O.id, O.mediaId);
        if (!pe || pe.el.readyState < 2 || !pe.el.videoWidth) return null;
        return { src: pe.el, sw: pe.el.videoWidth, sh: pe.el.videoHeight, live: true };
      }
      const ov = this.override[O.assetId];
      if (ov) return { src: ov, sw: ov.width, sh: ov.height, live: false, key: O.assetId + '@x' + ov.width };
      const as = O.assetId && KS.assets[O.assetId];
      if (!as) return null;
      return { src: as.img, sw: as.img.naturalWidth, sh: as.img.naturalHeight, live: false, key: O.assetId };
    },

    /* Green-screen removal: returns a canvas with the key colour made transparent. */
    chromaKey(O, s, w) {
      const ch = O.chroma;
      const pw = Math.max(2, Math.min(1280, Math.round(w))), ph = Math.max(2, Math.round((pw * s.sh) / s.sw));
      const cacheKey = !s.live && `${s.ckey || O.assetId}|${ch.color}|${ch.tolerance}|${ch.softness}|${pw}`;
      if (cacheKey && this.keyCache[O.id] && this.keyCache[O.id].key === cacheKey) return this.keyCache[O.id].cv;
      const cv = s.live ? (this.liveKeys[O.id] = this.liveKeys[O.id] || document.createElement('canvas')) : document.createElement('canvas');
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      const x = cv.getContext('2d', { willReadFrequently: true });
      x.clearRect(0, 0, pw, ph);
      x.drawImage(s.src, 0, 0, pw, ph);
      const img = x.getImageData(0, 0, pw, ph), d = img.data;
      const kr = parseInt(ch.color.slice(1, 3), 16), kg = parseInt(ch.color.slice(3, 5), 16), kb = parseInt(ch.color.slice(5, 7), 16);
      const kcb = -0.1687 * kr - 0.3313 * kg + 0.5 * kb, kcr = 0.5 * kr - 0.4187 * kg - 0.0813 * kb;
      const t0 = ch.tolerance * 1.4, t1 = t0 + ch.softness * 1.4 + 1;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const cb = -0.1687 * r - 0.3313 * g + 0.5 * b, cr = 0.5 * r - 0.4187 * g - 0.0813 * b;
        const dist = Math.hypot(cb - kcb, cr - kcr);
        if (dist >= t1) continue;
        const a = dist <= t0 ? 0 : (dist - t0) / (t1 - t0);
        d[i + 3] = d[i + 3] * a;
        // pull the key colour out of semi-transparent edges (spill suppression)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        d[i] = lum + (r - lum) * a; d[i + 1] = lum + (g - lum) * a; d[i + 2] = lum + (b - lum) * a;
      }
      x.putImageData(img, 0, 0);
      if (cacheKey) this.keyCache[O.id] = { key: cacheKey, cv };
      return cv;
    },

    drawOverlay(c, O, t, W, H, k) {
      if (!O.visible) return;
      const s = this.overlaySource(O);
      if (!s) return;
      const w = O.width * W * (O.scale || 1), h = (w * s.sh) / s.sw;
      const base = { cx: O.x * W, cy: O.y * H };
      const rot = (O.rotation * Math.PI) / 180;
      this.boxes[O.id] = { cx: base.cx, cy: base.cy, w, h, rot, anim: null };
      const st = KS.computeAnim(O, t, W, H, { cx: base.cx, cy: base.cy, w, h, lineH: h, nChars: 0 }, k);
      if (!st || st.alpha <= 0.001) return;
      const cx = base.cx + st.dx, cy = base.cy + st.dy;
      this.boxes[O.id].anim = { cx, cy, s: st.scale, rot: st.rot, special: false };
      const img = O.cutout && O.cutout.ai
        ? this.cutout(O, s, O.id, this.maskFor(O, s, O.id), !s.live && s.key)
        : O.chroma.enabled ? this.chromaKey(O, s, w) : s.src;
      const r = (KS.clamp(O.radius, 0, 100) / 100) * (Math.min(w, h) / 2);
      const shape = (ctx) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r); else ctx.rect(-w / 2, -h / 2, w, h); };

      c.save();
      c.globalAlpha = KS.clamp(O.opacity * st.alpha, 0, 1);
      c.globalCompositeOperation = O.blend || 'source-over';
      c.translate(cx, cy);
      c.rotate(rot + st.rot);
      c.scale(st.scale, st.scale);
      if (st.wipe < 1) { c.beginPath(); c.rect(-w / 2, -h / 2, w * st.wipe, h); c.clip(); }
      if (O.shadow.enabled) {
        c.shadowColor = O.shadow.color; c.shadowBlur = O.shadow.blur * k;
        c.shadowOffsetX = O.shadow.x * k; c.shadowOffsetY = O.shadow.y * k;
        if (r > 0 && !O.chroma.enabled) { c.fillStyle = '#000'; shape(c); c.fill(); }
      }
      if (r > 0) {
        c.save();
        c.shadowColor = 'transparent';
        shape(c); c.clip();
        c.drawImage(img, -w / 2, -h / 2, w, h);
        c.restore();
      } else {
        c.drawImage(img, -w / 2, -h / 2, w, h);
      }
      c.shadowColor = 'transparent';
      if (O.border.enabled && O.border.width > 0) {
        c.globalCompositeOperation = 'source-over';
        c.lineWidth = O.border.width * k;
        c.strokeStyle = O.border.color;
        shape(c); c.stroke();
      }
      c.restore();
    },
  });

  KS.hasLetterSpacing = hasLetterSpacing;
  void R;
})();
