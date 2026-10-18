/* AK Knockout Studio — export
 *
 * Three ways out:
 *   hq   frame by frame with WebCodecs: every frame is rendered exactly, nothing is dropped,
 *        any resolution up to 4K, H.264 / HEVC / AV1 in MP4 or VP9 / AV1 in WebM.
 *   rt   real-time recording through MediaRecorder (the v1 method; works in more browsers).
 *   wav  the soundtrack only, as an uncompressed WAV file.
 */
(function () {
  'use strict';
  const KS = window.KS;

  const RT_CANDIDATES = [
    { label: 'MP4 (H.264)', mime: 'video/mp4;codecs=avc1.640028,mp4a.40.2', ext: 'mp4' },
    { label: 'MP4 (H.264)', mime: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
    { label: 'MP4 (VP9)', mime: 'video/mp4;codecs=vp9,opus', ext: 'mp4' },
    { label: 'MP4', mime: 'video/mp4', ext: 'mp4' },
    { label: 'WebM (VP9)', mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { label: 'WebM (VP8)', mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { label: 'WebM', mime: 'video/webm', ext: 'webm' },
  ];

  const HQ_CANDIDATES = [
    { id: 'mp4-avc', label: 'MP4 · H.264 (plays everywhere)', container: 'mp4', mux: 'avc', ext: 'mp4',
      codecs: ['avc1.640034', 'avc1.640033', 'avc1.640032', 'avc1.64002a', 'avc1.640028', 'avc1.4d0034', 'avc1.4d0028', 'avc1.42003e', 'avc1.42001f'] },
    { id: 'mp4-hevc', label: 'MP4 · H.265 / HEVC (smaller files)', container: 'mp4', mux: 'hevc', ext: 'mp4',
      codecs: ['hvc1.1.6.L156.B0', 'hvc1.1.6.L153.B0', 'hvc1.1.6.L150.B0', 'hvc1.1.6.L123.B0', 'hvc1.1.6.L120.B0'] },
    { id: 'mp4-av1', label: 'MP4 · AV1 (smallest files, newer players)', container: 'mp4', mux: 'av1', ext: 'mp4',
      codecs: ['av01.0.13M.08', 'av01.0.12M.08', 'av01.0.09M.08', 'av01.0.08M.08'] },
    { id: 'webm-vp9', label: 'WebM · VP9', container: 'webm', mux: 'V_VP9', ext: 'webm',
      codecs: ['vp09.00.51.08', 'vp09.00.50.08', 'vp09.00.41.08', 'vp09.00.40.08'] },
    { id: 'webm-av1', label: 'WebM · AV1', container: 'webm', mux: 'V_AV1', ext: 'webm',
      codecs: ['av01.0.13M.08', 'av01.0.12M.08', 'av01.0.08M.08'] },
  ];

  const safeName = () => (KS.project.name || 'video').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'video';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function videoConfig(c, codec, w, h, fps, bitrate) {
    const cfg = { codec, width: w, height: h, bitrate, framerate: fps, bitrateMode: 'variable', latencyMode: 'quality' };
    if (c.mux === 'avc') cfg.avc = { format: 'avc' };
    if (c.mux === 'hevc') cfg.hevc = { format: 'hevc' };
    return cfg;
  }

  const E = (KS.exporter = {
    active: false, hq: false, cancelled: false, recorder: null, onProgress: null,

    /* ---------- capability checks ---------- */
    supported() { return this.supportsHQ() || this.supportsRT(); },
    supportsRT() { return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream; },
    supportsHQ() { return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && !!window.Mp4Muxer && !!window.WebMMuxer; },
    formats() { return this.rtFormats(); }, // v1 name
    rtFormats() {
      if (!this.supportsRT()) return [];
      const seen = new Set();
      return RT_CANDIDATES.filter((c) => {
        if (!MediaRecorder.isTypeSupported(c.mime) || seen.has(c.label)) return false;
        seen.add(c.label);
        return true;
      });
    },
    /* Formats this computer can encode at the given size. */
    async hqFormats(w, h, fps, bitrate) {
      if (!this.supportsHQ()) return [];
      const out = [];
      for (const c of HQ_CANDIDATES) {
        for (const codec of c.codecs) {
          try {
            const r = await VideoEncoder.isConfigSupported(videoConfig(c, codec, w, h, fps, bitrate));
            if (r.supported) { out.push({ ...c, codec }); break; }
          } catch (e) { /* try the next profile */ }
        }
      }
      return out;
    },
    async audioCodecFor(container, kbps) {
      if (typeof AudioEncoder === 'undefined') return null;
      const tries = container === 'mp4' ? [['mp4a.40.2', 'aac'], ['opus', 'opus']] : [['opus', 'opus']];
      for (const [codec, mux] of tries) {
        try {
          const r = await AudioEncoder.isConfigSupported({ codec, sampleRate: 48000, numberOfChannels: 2, bitrate: kbps * 1000 });
          if (r.supported) return { codec, mux };
        } catch (e) { /* next */ }
      }
      return null;
    },
    /* A sensible bitrate for the size and frame rate (about 16 Mbps for 1080p at 30 fps). */
    autoBitrate(w, h, fps) { return Math.round(KS.clamp(w * h * fps * 0.26, 2e6, 120e6)); },

    /* ---------- high quality, frame by frame ---------- */
    async startHQ({ format, width: W, height: H, fps = 30, bitrate, audio = true, audioKbps = 192, enhance = false, fileHandle = null }, onProgress) {
      if (this.active) return null;
      const P = KS.project, pl = KS.player, R = KS.renderer;
      const back = pl.t;
      pl.pause();
      this.active = true;
      this.hq = true; // the main loop leaves the canvas alone while this runs
      this.cancelled = false;
      let writable = null;
      try {
        if (document.fonts) await document.fonts.ready;
        R.extraSharpen = enhance ? 30 : 0;
        KS.app.setRenderSize(W, H);
        const dur = pl.duration;
        const N = Math.max(1, Math.round(dur * fps));

        // 1. sound: mix offline, then encode
        let aud = null, audioChunks = [];
        if (audio && pl.hasSound) {
          aud = await this.audioCodecFor(format.container, audioKbps);
          if (aud) {
            const buf = await KS.mix.render(48000, (m) => onProgress && onProgress(0, m));
            if (this.cancelled) return null;
            onProgress && onProgress(0, 'Encoding sound…');
            audioChunks = await this.encodeAudio(buf, aud.codec, audioKbps);
          }
        }
        if (this.cancelled) return null;

        // 2. container
        const isMp4 = format.container === 'mp4';
        const Lib = isMp4 ? window.Mp4Muxer : window.WebMMuxer;
        let target;
        if (fileHandle) {
          writable = await fileHandle.createWritable();
          target = new Lib.FileSystemWritableFileStreamTarget(writable);
        } else target = new Lib.ArrayBufferTarget();
        const muxOpts = isMp4
          ? {
            target, fastStart: fileHandle ? false : 'in-memory', firstTimestampBehavior: 'offset',
            video: { codec: format.mux, width: W, height: H, frameRate: fps },
            audio: audioChunks.length ? { codec: aud.mux, numberOfChannels: 2, sampleRate: 48000 } : undefined,
          }
          : {
            target, firstTimestampBehavior: 'offset',
            video: { codec: format.mux, width: W, height: H, frameRate: fps },
            audio: audioChunks.length ? { codec: 'A_OPUS', numberOfChannels: 2, sampleRate: 48000 } : undefined,
          };
        const muxer = new Lib.Muxer(muxOpts);
        let ai = 0;
        const flushAudio = (ts) => {
          while (ai < audioChunks.length && (ts === Infinity || audioChunks[ai][0].timestamp <= ts)) {
            muxer.addAudioChunk(audioChunks[ai][0], audioChunks[ai][1]);
            ai++;
          }
        };

        // 3. picture
        let encErr = null;
        const enc = new VideoEncoder({
          output: (chunk, meta) => { flushAudio(chunk.timestamp); muxer.addVideoChunk(chunk, meta); },
          error: (e) => { encErr = e; },
        });
        enc.configure(videoConfig(format, format.codec, W, H, fps, bitrate));
        const t0 = performance.now();
        const gop = Math.max(1, Math.round(fps * 2));
        for (let i = 0; i < N; i++) {
          if (this.cancelled || encErr) break;
          const t = Math.min(i / fps, Math.max(0, dur - 1e-4));
          await pl.seekAsync(t);
          await this.prepareMasks(t);
          R.render(t);
          const frame = new VideoFrame(R.cv, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
          enc.encode(frame, { keyFrame: i % gop === 0 });
          frame.close();
          while (enc.encodeQueueSize > 4) await wait(4);
          if (onProgress && (i % 3 === 0 || i === N - 1)) {
            const el = (performance.now() - t0) / 1000, left = (el / (i + 1)) * (N - i - 1);
            onProgress((i + 1) / N, `Frame ${i + 1} of ${N} · about ${left < 90 ? Math.ceil(left) + ' s' : Math.ceil(left / 60) + ' min'} left`);
          }
        }
        if (encErr) throw new Error('The video encoder stopped: ' + encErr.message);
        if (this.cancelled) { try { enc.close(); } catch (e) { /* ignore */ } return null; }
        onProgress && onProgress(1, 'Finishing the file…');
        await enc.flush();
        enc.close();
        flushAudio(Infinity);
        muxer.finalize();
        const filename = `${safeName()}.${format.ext}`;
        if (writable) {
          await writable.close();
          writable = null;
          return { blob: null, savedToFile: true, filename: fileHandle.name || filename };
        }
        const type = isMp4 ? 'video/mp4' : 'video/webm';
        return { blob: new Blob([target.buffer], { type }), filename };
      } finally {
        if (writable) { try { await writable.abort(); } catch (e) { /* ignore */ } }
        R.extraSharpen = 0;
        R.exportMasks = {};
        this.active = false;
        this.hq = false;
        KS.app.applyCanvasSize();
        pl.seek(Math.min(back, pl.duration));
      }
    },

    /* AI cut-outs on videos: work out the exact mask for this frame before drawing it. */
    async prepareMasks(t) {
      const R = KS.renderer, P = KS.project;
      R.exportMasks = {};
      const jobs = [];
      for (const e of KS.seq.at(t)) {
        const c = e.clip;
        if (c.kind !== 'video' || !c.cutout.ai) continue;
        const pe = KS.pool.peek(c.id);
        if (pe) jobs.push([c.id, pe.el]);
      }
      for (const O of P.overlays) {
        if (O.kind !== 'video' || !O.cutout.ai || !O.visible || t < O.start || t > O.end) continue;
        const pe = KS.pool.peek(O.id);
        if (pe) jobs.push([O.id, pe.el]);
      }
      for (const [id, el] of jobs) {
        try { R.exportMasks[id] = await KS.ai.maskNow(id, el); } catch (e) { /* draw without it */ }
      }
    },

    /* ---------- photos ---------- */
    aiCache: {}, // `${assetId}|${scale}|${quality}` -> upscaled canvas, reused between exports

    /* Pictures that would be enlarged in the export, with the AI scale that suits each. */
    upscaleJobs(outW, outH) {
      const P = KS.project, jobs = {};
      const need = (assetId, drawnW) => {
        const as = assetId && KS.assets[assetId];
        if (!as) return;
        const nat = as.img.naturalWidth, r = drawnW / nat;
        let scale = r > 2.4 ? 4 : r > 1.15 ? 2 : 0;
        while (scale && Math.max(nat, as.img.naturalHeight) * scale > KS.ai.MAX_OUTPUT) scale = scale === 4 ? 2 : 0;
        if (scale && (!jobs[assetId] || jobs[assetId] < scale)) jobs[assetId] = scale;
      };
      const k = outW / P.canvas.w;
      if (P.mode === 'collage') {
        const rects = KS.renderer.collageRects(outW, outH, Math.min(outW, outH) / 1080);
        P.clips.forEach((c, i) => { if (c.kind === 'image' && rects[i]) need(c.assetId, Math.max(rects[i].w, rects[i].h * (c.srcW / Math.max(1, c.srcH))) * c.zoom); });
      } else {
        P.clips.forEach((c) => {
          if (c.kind !== 'image') return;
          const crop = c.crop && KS.renderer.hasCrop(c.crop) ? c.crop.w : 1;
          need(c.assetId, (outW / crop) * c.zoom);
        });
      }
      P.overlays.forEach((O) => { if (O.kind === 'image' && O.visible) need(O.assetId, O.width * outW * (O.scale || 1)); });
      return Object.entries(jobs).map(([assetId, scale]) => ({ assetId, scale, k }));
    },

    async startPhoto({ type = 'image/png', width: W, height: H, quality = 0.92, transparent = false, ai = false, aiQuality = 'fast' }, onProgress) {
      if (this.active) return null;
      const R = KS.renderer;
      this.active = true;
      this.cancelled = false;
      this._abort = new AbortController();
      try {
        if (document.fonts) await document.fonts.ready;
        R.override = {};
        if (ai) {
          const jobs = this.upscaleJobs(W, H);
          let n = 0;
          for (const j of jobs) {
            n++;
            const key = `${j.assetId}|${j.scale}|${aiQuality}`;
            if (!this.aiCache[key]) {
              this.aiCache[key] = await KS.ai.upscale(KS.assets[j.assetId].img, {
                scale: j.scale, quality: aiQuality, signal: this._abort.signal,
                onProgress: (p, m) => onProgress && onProgress((n - 1 + p) / (jobs.length + 0.2), `Photo ${n} of ${jobs.length}: ${m}`),
              });
            }
            if (this.cancelled) return null;
            R.override[j.assetId] = this.aiCache[key];
          }
        }
        onProgress && onProgress(0.97, 'Drawing the final picture…');
        R.transparent = true;
        KS.app.setRenderSize(W, H);
        R.prepCache = {}; R.cutCache = {};
        R.render(0);
        let out = R.cv;
        if (!transparent) {
          // see-through areas become white (JPG cannot store transparency)
          out = document.createElement('canvas');
          out.width = W; out.height = H;
          const x = out.getContext('2d');
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
          x.drawImage(R.cv, 0, 0);
        }
        const blob = await new Promise((r) => out.toBlob(r, type, quality));
        if (!blob) throw new Error('The picture is too large for this computer to save. Choose a smaller size.');
        const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[type];
        return { blob, filename: `${safeName()}.${ext}`, w: W, h: H };
      } catch (e) {
        if (this.cancelled || (e && e.name === 'AbortError')) return null;
        throw e;
      } finally {
        R.override = {}; R.transparent = KS.isPhoto(); R.prepCache = {}; R.cutCache = {};
        this.active = false;
        this._abort = null;
        KS.app.applyCanvasSize();
      }
    },

    async encodeAudio(buf, codec, kbps) {
      const chunks = [];
      let err = null;
      const enc = new AudioEncoder({ output: (c, m) => chunks.push([c, m]), error: (e) => { err = e; } });
      enc.configure({ codec, sampleRate: 48000, numberOfChannels: 2, bitrate: kbps * 1000 });
      const L = buf.getChannelData(0), Rr = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
      const step = 4800;
      for (let o = 0; o < buf.length; o += step) {
        const n = Math.min(step, buf.length - o);
        const data = new Float32Array(n * 2);
        data.set(L.subarray(o, o + n), 0);
        data.set(Rr.subarray(o, o + n), n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((o / 48000) * 1e6), data });
        enc.encode(ad);
        ad.close();
        if (enc.encodeQueueSize > 20) await wait(2);
      }
      await enc.flush();
      enc.close();
      if (err) throw new Error('The audio encoder stopped: ' + err.message);
      return chunks;
    },

    /* ---------- sound only ---------- */
    async startWav(onProgress) {
      this.active = true;
      this.cancelled = false;
      try {
        const buf = await KS.mix.render(48000, (m) => onProgress && onProgress(0.5, m));
        if (this.cancelled) return null;
        return { blob: KS.mix.toWav(buf), filename: `${safeName()}.wav` };
      } finally { this.active = false; }
    },

    /* ---------- real time (v1) ---------- */
    async start({ mime, ext, width, height, scale = 1, fps = 30, mbps = 12, bitrate, audio = true }, onProgress) {
      if (this.active) return null;
      const P = KS.project, pl = KS.player, R = KS.renderer;
      pl.pause();
      this.active = true;
      this.cancelled = false;
      this.onProgress = onProgress;
      const W = width || KS.even(P.canvas.w * scale), H = height || KS.even(P.canvas.h * scale);
      KS.app.setRenderSize(W, H);
      await pl.seekAsync(0);
      R.render(0);

      const stream = R.cv.captureStream(fps);
      if (audio && pl.hasSound) {
        KS.audio.ensure();
        if (KS.audio.dest) KS.audio.dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      }
      let rec;
      try {
        rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate || Math.round(mbps * 1e6), audioBitsPerSecond: 192000 });
      } catch (e) {
        this.finish();
        throw new Error('This browser refused that format. Pick another format and try again.');
      }
      this.recorder = rec;
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((resolve) => { rec.onstop = resolve; });
      rec.start(250);
      pl.play();

      await new Promise((resolve) => { this._resolveRun = resolve; });
      if (rec.state !== 'inactive') rec.stop();
      await stopped;
      stream.getVideoTracks().forEach((t) => t.stop());
      const cancelled = this.cancelled;
      this.finish();
      if (cancelled) return null;
      const blob = new Blob(chunks, { type: mime.split(';')[0] });
      return { blob, filename: `${safeName()}.${ext}` };
    },

    /* Called every animation frame by the main loop (real-time mode). */
    tick() {
      if (!this.active || !this._resolveRun) return;
      const pl = KS.player;
      if (this.onProgress) this.onProgress(pl.t / pl.duration, `Recording ${KS.fmtSec(pl.t)} of ${KS.fmtSec(pl.duration)}. Keep this window visible.`);
      if (this.cancelled || !pl.playing) {
        const r = this._resolveRun;
        this._resolveRun = null;
        r();
      }
    },

    cancel() {
      if (!this.active) return;
      this.cancelled = true;
      if (this._abort) this._abort.abort();
      if (this._resolveRun) KS.player.pause();
    },

    finish() {
      this.active = false;
      this.recorder = null;
      this._resolveRun = null;
      KS.app.applyCanvasSize();
      KS.player.seek(0);
    },
  });
  void E;
})();
