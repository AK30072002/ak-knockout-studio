/* AK Knockout Studio — on-device AI
 *
 * Everything runs on this computer; nothing is uploaded. The libraries and models
 * ship with the app (js/vendor/ai) and load the first time a tool needs them.
 *
 *   KS.ai.upscale(picture, { scale, quality })   ESRGAN super-resolution (UpscalerJS + TensorFlow.js)
 *   KS.ai.personMask(picture)                    person segmentation (MediaPipe Selfie Segmentation)
 *   KS.ai.liveMask(owner, video)                 the same, kept up to date for a playing video
 */
(function () {
  'use strict';
  const KS = window.KS;
  const BASE = 'js/vendor/ai/';
  const scripts = {};
  function loadScript(src) {
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = BASE + src;
      s.onload = () => resolve();
      s.onerror = () => { delete scripts[src]; reject(new Error('Could not load the AI component ' + src + '.')); };
      document.head.append(s);
    });
    return scripts[src];
  }

  const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

  /* Is WebGL running on a real graphics card? Software renderers are far slower than WASM. */
  function gpuInfo() {
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (!gl) return { ok: false, name: 'none' };
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const soft = /swiftshader|llvmpipe|software|basic render|softpipe/i.test(name || '');
      return { ok: !soft, name: String(name || 'unknown') };
    } catch (e) { return { ok: false, name: 'none' }; }
  }

  const MODELS = {
    'fast-2': ['esrgan-slim-2x.min.js', 'ESRGANSlim2x', 'slim-x2'],
    'fast-4': ['esrgan-slim-4x.min.js', 'ESRGANSlim4x', 'slim-x4'],
    'detail-2': ['esrgan-medium-2x.min.js', 'ESRGANMedium2x', 'medium-x2'],
    'detail-4': ['esrgan-medium-4x.min.js', 'ESRGANMedium4x', 'medium-x4'],
  };

  const AI = (KS.ai = {
    engine: (() => { try { return localStorage.getItem('akks.aiEngine') || 'auto'; } catch (e) { return 'auto'; } })(),
    backend: null,
    gpu: null,
    upscalers: {},
    MAX_OUTPUT: 8192, // longest side of an upscaled picture

    setEngine(v) {
      this.engine = v;
      try { localStorage.setItem('akks.aiEngine', v); } catch (e) { /* ignore */ }
      if (window.tf && this.backend) this.backend = null; // chosen again on next use
    },
    gpuInfo() { if (!this.gpu) this.gpu = gpuInfo(); return this.gpu; },

    async loadTF() {
      await loadScript('tf.min.js');
      await loadScript('tf-backend-wasm.min.js');
      await loadScript('upscaler.min.js');
      const tf = window.tf;
      if (tf.wasm && tf.wasm.setWasmPaths) tf.wasm.setWasmPaths(new URL(BASE, location.href).href);
      if (!this.backend) {
        const want = this.engine === 'gpu' ? ['webgl', 'wasm', 'cpu']
          : this.engine === 'cpu' ? ['wasm', 'cpu']
            : this.gpuInfo().ok ? ['webgl', 'wasm', 'cpu'] : ['wasm', 'webgl', 'cpu'];
        for (const b of want) {
          try { if (await tf.setBackend(b)) { await tf.ready(); this.backend = b; break; } } catch (e) { /* next */ }
        }
      }
      return tf;
    },
    engineLabel() {
      return { webgl: 'graphics card', wasm: 'processor', cpu: 'processor (slow mode)' }[this.backend] || 'not started';
    },

    /* The largest scale that keeps the result within MAX_OUTPUT. */
    maxScale(w, h) { return this.MAX_OUTPUT / Math.max(w, h); },

    /* Super-resolution: returns a new canvas scale× larger. Transparency is kept. */
    async upscale(src, { scale = 2, quality = 'fast', onProgress, signal } = {}) {
      const sw = src.naturalWidth || src.videoWidth || src.width, sh = src.naturalHeight || src.videoHeight || src.height;
      if (sw * scale > this.MAX_OUTPUT || sh * scale > this.MAX_OUTPUT) {
        throw new Error(`The result would be larger than ${this.MAX_OUTPUT} pixels. Choose 2× or crop the picture first.`);
      }
      onProgress && onProgress(0, 'Loading the AI model…');
      const tf = await this.loadTF();
      const key = `${quality}-${scale}`;
      const [file, global, dir] = MODELS[key] || MODELS['fast-2'];
      await loadScript(file);
      if (!this.upscalers[key]) {
        this.upscalers[key] = new window.Upscaler({ model: { ...window[global], path: BASE + 'models/' + dir + '/model.json' } });
        await this.upscalers[key].getModel();
      }
      const up = this.upscalers[key];
      // the picture without transparency (the model works on colour only)
      const inp = document.createElement('canvas');
      inp.width = sw; inp.height = sh;
      const ic = inp.getContext('2d');
      ic.drawImage(src, 0, 0);
      const alpha = this.hasAlpha(ic, sw, sh);
      if (alpha) {
        ic.globalCompositeOperation = 'destination-over';
        ic.fillStyle = '#808080'; ic.fillRect(0, 0, sw, sh);
      }
      const patch = this.backend === 'webgl' ? 128 : 64;
      onProgress && onProgress(0.02, `Enhancing with AI on the ${this.engineLabel()}…`);
      const t0 = performance.now();
      const tensor = await up.upscale(inp, {
        output: 'tensor', patchSize: patch, padding: 6, signal,
        progress: (p) => {
          if (!onProgress) return;
          const el = (performance.now() - t0) / 1000, left = p > 0.02 ? (el / p) * (1 - p) : 0;
          onProgress(0.02 + p * 0.96, `Enhancing with AI… ${Math.round(p * 100)}%${left > 1 ? ` · about ${left < 90 ? Math.ceil(left) + ' s' : Math.ceil(left / 60) + ' min'} left` : ''}`);
        },
      });
      const [oh, ow] = tensor.shape;
      const out = document.createElement('canvas');
      out.width = ow; out.height = oh;
      const px = tf.tidy(() => tensor.clipByValue(0, 255).round().cast('int32'));
      tensor.dispose();
      await tf.browser.toPixels(px, out);
      px.dispose();
      if (alpha) {
        // bring the transparency back, resized smoothly
        const a = document.createElement('canvas');
        a.width = ow; a.height = oh;
        const ac = a.getContext('2d');
        ac.imageSmoothingQuality = 'high';
        ac.drawImage(src, 0, 0, ow, oh);
        const oc = out.getContext('2d');
        oc.globalCompositeOperation = 'destination-in';
        oc.drawImage(a, 0, 0);
      }
      onProgress && onProgress(1, 'Done');
      return out;
    },

    /* High-quality resize without AI, with a little sharpening. */
    classicUpscale(src, scale) {
      const sw = src.naturalWidth || src.videoWidth || src.width, sh = src.naturalHeight || src.videoHeight || src.height;
      const out = document.createElement('canvas');
      out.width = Math.round(sw * scale); out.height = Math.round(sh * scale);
      const c = out.getContext('2d');
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(src, 0, 0, out.width, out.height);
      if (KS.gpuSharpen && KS.gpuSharpen.init()) KS.gpuSharpen.apply(out, 35);
      return out;
    },

    hasAlpha(ctx, w, h) {
      const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 40000)));
      const sx = Math.ceil(w / step), sy = Math.ceil(h / step);
      const t = document.createElement('canvas');
      t.width = sx; t.height = sy;
      const tc = t.getContext('2d');
      tc.drawImage(ctx.canvas, 0, 0, sx, sy);
      const d = tc.getImageData(0, 0, sx, sy).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
      return false;
    },

    /* ---------- person segmentation ---------- */
    seg: null, segQueue: Promise.resolve(), segResult: null,
    async loadSeg() {
      if (this.seg) return this.seg;
      if (!this._segLoading) {
        this._segLoading = (async () => {
          const probe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
          if (!probe) throw new Error('Background removal needs WebGL graphics, which is turned off or unavailable here. Update your graphics driver, or use Erase by hand.');
          await loadScript('selfie/selfie_segmentation.js');
          const s = new window.SelfieSegmentation({ locateFile: (f) => BASE + 'selfie/' + f });
          s.setOptions({ modelSelection: 0, selfieMode: false });
          s.onResults((r) => { this.segResult = r; });
          await withTimeout(s.initialize(), 90000, 'The background-removal AI took too long to start.');
          this.seg = s;
          return s;
        })();
        this._segLoading.catch(() => { this._segLoading = null; });
      }
      return this._segLoading;
    },

    /* Returns a canvas whose alpha is the person (1) versus background (0). */
    personMask(src, maxSide = 1024) {
      const job = this.segQueue.then(async () => {
        const s = await this.loadSeg();
        this.segResult = null;
        await withTimeout(s.send({ image: src }), 30000, 'The background-removal AI stopped responding.');
        const m = this.segResult && this.segResult.segmentationMask;
        if (!m) throw new Error('The AI could not read this picture.');
        const sw = src.naturalWidth || src.videoWidth || src.width, sh = src.naturalHeight || src.videoHeight || src.height;
        const k = Math.min(1, maxSide / Math.max(sw, sh));
        const c = document.createElement('canvas');
        c.width = Math.max(2, Math.round(sw * k)); c.height = Math.max(2, Math.round(sh * k));
        const x = c.getContext('2d');
        x.imageSmoothingQuality = 'high';
        x.drawImage(m, 0, 0, c.width, c.height);
        return c;
      });
      this.segQueue = job.catch(() => {});
      return job;
    },

    /* Turns a raw mask into a clean one: threshold (0..1) and soft edge (feather, px of the mask). */
    refineMask(mask, threshold = 0.5, out) {
      const w = mask.width, h = mask.height;
      out = out || document.createElement('canvas');
      if (out.width !== w || out.height !== h) { out.width = w; out.height = h; }
      const x = out.getContext('2d', { willReadFrequently: true });
      x.clearRect(0, 0, w, h);
      x.drawImage(mask, 0, 0);
      const img = x.getImageData(0, 0, w, h), d = img.data;
      const lo = KS.clamp(threshold - 0.18, 0, 1) * 255, hi = KS.clamp(threshold + 0.18, 0.02, 1) * 255;
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        const v = a <= lo ? 0 : a >= hi ? 1 : (a - lo) / (hi - lo);
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = Math.round(v * v * (3 - 2 * v) * 255);
      }
      x.putImageData(img, 0, 0);
      return out;
    },

    /* ---------- masks for playing video ---------- */
    live: {},
    /* The latest mask for this element; a new one is worked out in the background. */
    liveMask(owner, el) {
      const L = (this.live[owner] = this.live[owner] || { canvas: null, time: -1, busy: false, failed: false });
      if (L.failed) return null;
      if (!L.busy && Math.abs(el.currentTime - L.time) > 1e-3 && el.readyState >= 2) {
        L.busy = true;
        const at = el.currentTime;
        this.personMask(el, 640).then((m) => { L.canvas = m; L.time = at; KS.requestRender(); })
          .catch((e) => { L.failed = true; KS.toast('AI background removal is unavailable here: ' + e.message, 6000); })
          .finally(() => { L.busy = false; });
      }
      return L.canvas;
    },
    /* Exact mask for the element's current frame (export waits for this). */
    async maskNow(owner, el) {
      const L = (this.live[owner] = this.live[owner] || { canvas: null, time: -1, busy: false, failed: false });
      if (Math.abs(el.currentTime - L.time) < 1e-3 && L.canvas) return L.canvas;
      const at = el.currentTime;
      const m = await this.personMask(el, 960);
      L.canvas = m; L.time = at;
      return m;
    },
  });
  void AI;
})();
