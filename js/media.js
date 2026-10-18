/* AK Knockout Studio — media library, playback elements, audio routing, sequence timing
 *
 * KS.mediaLib  imported video/audio files for this session (never saved in the project)
 * KS.pool      one <video>/<audio> element per clip, overlay or audio track that uses a file
 * KS.audio     Web Audio routing: every element -> its own gain -> master -> speakers + export stream
 * KS.seq       where each clip sits on the timeline, including transition overlaps
 * KS.mix       volume curves shared by live playback and export, plus an offline mixdown
 */
(function () {
  'use strict';
  const KS = window.KS;

  const VIDEO_EXT = /\.(mp4|m4v|webm|mov|mkv|ogv|avi|3gp)$/i;
  const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|weba)$/i;
  const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i;

  KS.mediaKind = (file) => {
    const t = file.type || '';
    if (t.startsWith('audio/') || AUDIO_EXT.test(file.name)) return 'audio';
    if (t.startsWith('video/') || VIDEO_EXT.test(file.name)) return 'video';
    if (t.startsWith('image/') || IMAGE_EXT.test(file.name)) return 'image';
    if (/\.json$/i.test(file.name)) return 'project';
    return null;
  };

  /* ---------------- media library ---------------- */
  const ML = (KS.mediaLib = {
    items: {}, // id -> { id, name, kind, file, url, duration, w, h }
    decoded: {}, // id -> Promise<AudioBuffer|null>

    get(id) { return (id && this.items[id]) || null; },

    /* A file's identity across sessions (drafts and relinking use it). */
    keyOf(file) { return `${file.name}|${file.size}|${file.lastModified || 0}`; },

    /* Reads a video or audio file's metadata. Images go through KS.addImageAsset instead.
       The same file imported twice is loaded once. */
    load(file, forcedKey) {
      const key = forcedKey || this.keyOf(file);
      const known = Object.values(this.items).find((m) => m.key === key);
      if (known) return Promise.resolve(known);
      const kind = KS.mediaKind(file);
      if (kind !== 'video' && kind !== 'audio') return Promise.reject(new Error(`${file.name} is not a video or audio file.`));
      return new Promise((resolve, reject) => {
        const el = document.createElement(kind === 'video' ? 'video' : 'audio');
        el.preload = 'metadata';
        el.muted = true;
        const url = URL.createObjectURL(file);
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          const id = 'm_' + KS.uid();
          const item = {
            id, key, name: file.name, kind, file, url,
            duration: el.duration, w: el.videoWidth || 0, h: el.videoHeight || 0,
          };
          this.items[id] = item;
          el.removeAttribute('src'); el.load();
          resolve(item);
        };
        el.addEventListener('loadedmetadata', () => {
          if (isFinite(el.duration)) { finish(); return; }
          // Recorded WebM files report Infinity until the end has been probed.
          const fix = () => { if (isFinite(el.duration)) { el.removeEventListener('durationchange', fix); finish(); } };
          el.addEventListener('durationchange', fix);
          el.currentTime = 1e101;
        });
        el.addEventListener('error', () => {
          if (done) return;
          done = true;
          URL.revokeObjectURL(url);
          reject(new Error(kind === 'video'
            ? `This browser can't play ${file.name}. Convert it to MP4 (H.264) or WebM and import again.`
            : `This browser can't play ${file.name}. Try MP3, WAV, M4A or OGG.`));
        });
        el.src = url;
      });
    },

    /* Items whose file isn't loaded in this session. */
    missing(p = KS.project) {
      const out = [];
      const need = (x) => !!x.mediaName && !this.get(x.mediaId);
      p.clips.forEach((c) => { if (c.kind === 'video' && need(c)) out.push(c); });
      p.overlays.forEach((o) => { if (o.kind === 'video' && need(o)) out.push(o); });
      p.audio.forEach((a) => { if (need(a)) out.push(a); });
      return out;
    },
    missingNames() { return [...new Set(this.missing().map((x) => x.mediaName))]; },

    /* Points every item that expects a file with this name at the loaded media. */
    relink(item) {
      let n = 0;
      for (const x of this.missing()) {
        if ((x.mediaKey && x.mediaKey === item.key) || x.mediaName === item.name) { x.mediaId = item.id; x.mediaKey = item.key; n++; }
      }
      return n;
    },
    /* After opening a project: reconnect anything whose file was already imported this session. */
    autoRelink() {
      const byName = {}, byKey = {};
      Object.values(this.items).forEach((m) => { byName[m.name] = m; byKey[m.key] = m; });
      for (const x of this.missing()) {
        const m = (x.mediaKey && byKey[x.mediaKey]) || byName[x.mediaName];
        if (m) { x.mediaId = m.id; x.mediaKey = m.key; }
      }
    },

    /* The same sound played backwards (for reversed clips). */
    decodeReversed(id) {
      const k = id + ':rev';
      if (this.decoded[k]) return this.decoded[k];
      this.decoded[k] = this.decode(id).then((buf) => {
        if (!buf) return null;
        const ctx = new OfflineAudioContext(buf.numberOfChannels, 1, buf.sampleRate);
        const out = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
        for (let c = 0; c < buf.numberOfChannels; c++) out.getChannelData(c).set(buf.getChannelData(c).slice().reverse());
        return out;
      });
      return this.decoded[k];
    },

    /* Decoded audio for the offline mixdown (export). Resolves null when a file has no sound. */
    decode(id) {
      if (this.decoded[id]) return this.decoded[id];
      const m = this.get(id);
      if (!m) return Promise.resolve(null);
      this.decoded[id] = (async () => {
        try {
          const buf = await m.file.arrayBuffer();
          const ctx = new OfflineAudioContext(2, 1, 48000);
          return await ctx.decodeAudioData(buf);
        } catch (e) { return null; }
      })();
      return this.decoded[id];
    },
  });

  /* ---------------- audio routing ---------------- */
  const A = (KS.audio = {
    ctx: null, master: null, dest: null,
    /* Must first be called from a user gesture (play / export). */
    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.dest = this.ctx.createMediaStreamDestination();
        this.master.connect(this.ctx.destination);
        this.master.connect(this.dest);
        Object.values(KS.pool.els).forEach((e) => this.route(e));
      } catch (err) {
        console.warn('Audio routing unavailable:', err);
        this.ctx = null;
      }
    },
    route(entry) {
      if (!this.ctx || entry.gain) return;
      try {
        entry.src = this.ctx.createMediaElementSource(entry.el);
        entry.gain = this.ctx.createGain();
        entry.gain.gain.value = 0;
        entry.src.connect(entry.gain);
        entry.gain.connect(this.master);
        entry.el.volume = 1;
      } catch (e) { /* element already routed elsewhere */ }
    },
    setGain(entry, v) {
      if (entry.gain) {
        if (Math.abs(entry.gain.gain.value - v) > 1e-3) entry.gain.gain.value = v;
      } else {
        entry.el.volume = KS.clamp(v, 0, 1);
      }
    },
    /* v1 name, still used after volume changes. */
    apply() { KS.player && KS.player.sync(false); },
  });

  /* ---------------- element pool ---------------- */
  KS.pool = {
    els: {}, // ownerId -> { el, mediaId, kind }
    get(ownerId, mediaId) {
      const m = ML.get(mediaId);
      if (!m) return null;
      let e = this.els[ownerId];
      if (e && e.mediaId === mediaId) return e;
      if (e) this.release(ownerId);
      const el = document.createElement(m.kind === 'video' ? 'video' : 'audio');
      el.preload = 'auto';
      el.playsInline = true;
      el.crossOrigin = 'anonymous';
      if ('preservesPitch' in el) el.preservesPitch = true;
      el.addEventListener('seeked', () => KS.requestRender());
      el.addEventListener('loadeddata', () => KS.requestRender());
      el.src = m.url;
      e = { el, mediaId, kind: m.kind, owner: ownerId };
      this.els[ownerId] = e;
      A.route(e);
      A.setGain(e, 0);
      return e;
    },
    peek(ownerId) { return this.els[ownerId] || null; },
    release(ownerId) {
      const e = this.els[ownerId];
      if (!e) return;
      try { e.el.pause(); } catch (err) { /* ignore */ }
      try { if (e.gain) e.gain.disconnect(); } catch (err) { /* ignore */ }
      e.el.removeAttribute('src');
      try { e.el.load(); } catch (err) { /* ignore */ }
      delete this.els[ownerId];
    },
    /* Frees elements whose owner no longer exists or changed file. */
    gc() {
      const P = KS.project, want = {};
      P.clips.forEach((c) => { if (c.kind === 'video') want[c.id] = c.mediaId; });
      P.overlays.forEach((o) => { if (o.kind === 'video') want[o.id] = o.mediaId; });
      P.audio.forEach((a) => { want[a.id] = a.mediaId; });
      Object.keys(this.els).forEach((id) => { if (want[id] !== this.els[id].mediaId) this.release(id); });
    },
    pauseAll(except) {
      Object.values(this.els).forEach((e) => { if (!except || !except.has(e.owner)) { if (!e.el.paused) e.el.pause(); A.setGain(e, 0); } });
    },
  };

  /* ---------------- sequence timing ---------------- */
  const S = (KS.seq = {
    srcLen(c) {
      if (c.kind !== 'video') return 0;
      const m = ML.get(c.mediaId);
      return m && isFinite(m.duration) ? m.duration : (c.srcDuration || c.trimOut || 10);
    },
    outPoint(c) {
      const d = this.srcLen(c);
      return c.trimOut == null ? d : Math.min(c.trimOut, d);
    },
    len(c) {
      if (c.kind === 'video') return Math.max(0.05, (this.outPoint(c) - c.trimIn) / c.speed);
      return Math.max(0.1, c.duration);
    },
    transitionLen(prev, c) {
      if (!prev || !c.transition || c.transition.type === 'none') return 0;
      return Math.max(0, Math.min(c.transition.dur, this.len(prev) * 0.5, this.len(c) * 0.5));
    },
    layout(P = KS.project) {
      const out = [];
      let t = 0;
      P.clips.forEach((c, i) => {
        const prev = P.clips[i - 1];
        const tin = this.transitionLen(prev, c);
        const start = Math.max(0, t - tin);
        const len = this.len(c);
        out.push({ clip: c, index: i, start, end: start + len, len, tin });
        t = start + len;
      });
      return out;
    },
    duration(P = KS.project) {
      const L = this.layout(P);
      return L.length ? Math.max(0.1, L[L.length - 1].end) : 5;
    },
    /* Clips visible at time t, in track order (at most two during a transition). */
    at(t, lay = this.layout()) {
      const out = [];
      const last = lay.length - 1;
      lay.forEach((e, i) => {
        if (t >= e.start - 1e-6 && (t < e.end || (i === last && t <= e.end + 1e-6))) out.push(e);
      });
      return out;
    },
    /* The clip "under the playhead" (the incoming one during a transition). */
    entryAt(t, lay = this.layout()) {
      const a = this.at(t, lay);
      return a[a.length - 1] || lay[lay.length - 1] || null;
    },
    srcTime(e, t) {
      const c = e.clip;
      const local = KS.clamp(t - e.start, 0, e.len);
      if (c.reverse) return Math.max(c.trimIn, this.outPoint(c) - local * c.speed - 0.001);
      return c.trimIn + local * c.speed;
    },
    progress(e, t) { return e.tin > 0 ? KS.clamp((t - e.start) / e.tin, 0, 1) : 1; },
  });

  /* ---------------- volume curves ---------------- */
  const fadeEnv = (local, len, fin, fout) => {
    let g = 1;
    if (fin > 0) g *= KS.clamp(local / fin, 0, 1);
    if (fout > 0) g *= KS.clamp((len - local) / fout, 0, 1);
    return g;
  };
  const masterGain = () => (KS.project.master.muted ? 0 : KS.project.master.volume);

  KS.mix = {
    clipGain(e, t, lay) {
      const c = e.clip;
      if (c.kind !== 'video' || c.muted) return 0;
      const local = t - e.start;
      if (local < -1e-6 || local > e.len + 1e-6) return 0;
      let g = c.volume * fadeEnv(local, e.len, c.fadeIn, c.fadeOut) * masterGain();
      if (e.tin > 0) g *= S.progress(e, t); // crossfade in
      const next = lay[e.index + 1];
      if (next && next.tin > 0 && t >= next.start) g *= 1 - S.progress(next, t); // crossfade out
      return g;
    },
    audioLen(a) {
      const m = ML.get(a.mediaId);
      const d = m && isFinite(m.duration) ? m.duration : a.srcDuration || 0;
      const out = a.trimOut == null ? d : Math.min(a.trimOut, d || a.trimOut);
      return Math.max(0.05, out - a.trimIn);
    },
    /* End time on the timeline (loops run to the end of the video). */
    audioEnd(a) { return a.loop ? Math.max(a.start + this.audioLen(a), S.duration()) : a.start + this.audioLen(a); },
    audioGain(a, t) {
      if (a.muted) return 0;
      const end = this.audioEnd(a);
      if (t < a.start || t > end) return 0;
      return a.volume * fadeEnv(t - a.start, end - a.start, a.fadeIn, a.fadeOut) * masterGain();
    },
    audioSrcTime(a, t) {
      const len = this.audioLen(a);
      let local = Math.max(0, t - a.start);
      if (a.loop) local %= len;
      return a.trimIn + Math.min(local, len);
    },
    overlayGain(o, t) {
      if (o.kind !== 'video' || o.muted || !o.visible || t < o.start || t > o.end) return 0;
      const f = o.anim;
      return o.volume * fadeEnv(t - o.start, o.end - o.start, f.fadeIn, f.fadeOut) * masterGain();
    },
    overlaySrcTime(o, t) {
      const m = ML.get(o.mediaId);
      const d = m ? m.duration : o.srcDuration || 0;
      return Math.min(o.trimIn + Math.max(0, t - o.start), Math.max(0, d - 0.04));
    },

    /* Renders the whole soundtrack offline (for high-quality export and WAV export). */
    async render(sampleRate = 48000, onStatus) {
      const P = KS.project, dur = S.duration(), lay = S.layout();
      const frames = Math.max(1, Math.ceil(dur * sampleRate));
      const ctx = new OfflineAudioContext(2, frames, sampleRate);
      const curveOf = (fn, t0, t1) => {
        const n = Math.max(2, Math.ceil((t1 - t0) * 100));
        const c = new Float32Array(n);
        for (let i = 0; i < n; i++) c[i] = fn(t0 + ((t1 - t0) * i) / (n - 1));
        return c;
      };
      const place = (buf, gainFn, t0, t1, offset, rate, loop) => {
        if (!buf || t1 - t0 < 0.01) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;
        if (loop) { src.loop = true; src.loopStart = loop[0]; src.loopEnd = loop[1]; }
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, 0);
        g.gain.setValueCurveAtTime(curveOf(gainFn, t0, t1), t0, t1 - t0);
        src.connect(g); g.connect(ctx.destination);
        src.start(t0, Math.min(offset, Math.max(0, buf.duration - 0.001)));
        src.stop(t1);
      };
      let n = 0;
      const jobs = [];
      lay.forEach((e) => { if (e.clip.kind === 'video' && !e.clip.muted && e.clip.volume > 0) jobs.push(['clip', e]); });
      P.overlays.forEach((o) => { if (o.kind === 'video' && !o.muted && o.visible) jobs.push(['ov', o]); });
      P.audio.forEach((a) => { if (!a.muted) jobs.push(['audio', a]); });
      for (const [type, x] of jobs) {
        if (onStatus) onStatus(`Preparing sound ${++n} of ${jobs.length}…`);
        if (type === 'clip') {
          const c = x.clip;
          const buf = await (c.reverse ? ML.decodeReversed(c.mediaId) : ML.decode(c.mediaId));
          const offset = c.reverse && buf ? Math.max(0, buf.duration - S.outPoint(c)) : c.trimIn;
          place(buf, (t) => this.clipGain(x, t, lay), x.start, x.end, offset, c.speed);
        } else if (type === 'ov') {
          const buf = await ML.decode(x.mediaId);
          place(buf, (t) => this.overlayGain(x, t), x.start, Math.min(x.end, dur), x.trimIn, 1);
        } else {
          const buf = await ML.decode(x.mediaId);
          const end = Math.min(this.audioEnd(x), dur);
          const loop = x.loop ? [x.trimIn, x.trimIn + this.audioLen(x)] : null;
          place(buf, (t) => this.audioGain(x, t), x.start, end, x.trimIn, 1, loop);
        }
      }
      if (onStatus) onStatus('Mixing sound…');
      return ctx.startRendering();
    },

    /* 16-bit PCM WAV file from an AudioBuffer. */
    toWav(buf) {
      const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length;
      const data = new DataView(new ArrayBuffer(44 + n * ch * 2));
      const str = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
      str(0, 'RIFF'); data.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE');
      str(12, 'fmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
      data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
      str(36, 'data'); data.setUint32(40, n * ch * 2, true);
      const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
      let o = 44;
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < ch; c++) {
          const v = KS.clamp(chans[c][i], -1, 1);
          data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2;
        }
      }
      return new Blob([data], { type: 'audio/wav' });
    },
  };
})();
