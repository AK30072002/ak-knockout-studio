/* AK Knockout Studio — playback engine
 *
 * One master clock (player.t). Every clip, video overlay and audio track that
 * uses a file has its own media element (KS.pool); sync() keeps each element at
 * the right place, speed and volume for the current time.
 */
(function () {
  'use strict';
  const KS = window.KS;
  const S = () => KS.seq;

  const P = (KS.player = {
    playing: false, t: 0, last: 0, stallSince: 0,

    init() { /* elements are created on demand by KS.pool */ },

    get duration() { return S().duration(); },

    /* Size of the first video (or photo) clip, used by "Match source". */
    get width() { const c = this.firstVisual(); return c ? c.srcW : 0; },
    get height() { const c = this.firstVisual(); return c ? c.srcH : 0; },
    firstVisual() { return KS.project.clips.find((c) => (c.kind === 'video' || c.kind === 'image') && c.srcW) || null; },
    /* v1 compatibility: "kind" of the clip under the playhead. */
    get kind() { const e = S().entryAt(this.t); return e ? e.clip.kind : 'demo'; },
    get hasSound() {
      const Pj = KS.project;
      return Pj.clips.some((c) => c.kind === 'video' && KS.mediaLib.get(c.mediaId)) ||
        Pj.audio.some((a) => KS.mediaLib.get(a.mediaId)) ||
        Pj.overlays.some((o) => o.kind === 'video' && !o.muted && KS.mediaLib.get(o.mediaId));
    },
    entry() { return S().entryAt(this.t); },

    play() {
      if (this.playing || KS.isPhoto()) return;
      if (this.t >= this.duration - 0.01) this.seek(0);
      KS.audio.ensure();
      this.playing = true;
      this.last = performance.now();
      this.stallSince = 0;
      this.sync(true);
      KS.emit('play-state');
    },
    pause() {
      const was = this.playing;
      this.playing = false;
      KS.pool.pauseAll();
      this.sync(false);
      if (was) KS.emit('play-state');
      KS.requestRender();
    },
    toggle() { if (this.playing) this.pause(); else this.play(); },

    seek(t) {
      this.t = KS.clamp(t, 0, this.duration);
      this.sync(this.playing);
      KS.requestRender();
      KS.emit('time', this.t);
    },
    /* Seeks and waits until every visible video has the exact frame (used by export). */
    async seekAsync(t) {
      this.seek(t);
      const els = this.needed(this.t).map((n) => n.entry.el).filter((el) => el instanceof HTMLVideoElement);
      await Promise.all(els.map((el) => new Promise((resolve) => {
        let done = false;
        const fin = () => { if (done) return; done = true; el.removeEventListener('seeked', fin); el.removeEventListener('loadeddata', fin); resolve(); };
        if (!el.seeking && el.readyState >= 2) { fin(); return; }
        el.addEventListener('seeked', fin);
        el.addEventListener('loadeddata', fin);
        setTimeout(fin, 4000);
      })));
    },
    step(frames) {
      this.pause();
      this.seek(this.t + frames / KS.project.canvas.fps);
    },

    /* Which media elements are needed at time t, with their target time, speed and volume. */
    needed(t) {
      const out = [];
      const lay = S().layout();
      for (const e of S().at(t, lay)) {
        const c = e.clip;
        if (c.kind !== 'video') continue;
        const pe = KS.pool.get(c.id, c.mediaId);
        // reversed clips are shown by seeking frame by frame; their sound is only in the export
        if (pe) out.push({ entry: pe, target: S().srcTime(e, t), rate: c.speed, gain: c.reverse ? 0 : KS.mix.clipGain(e, t, lay), reverse: c.reverse });
      }
      for (const o of KS.project.overlays) {
        if (o.kind !== 'video' || !o.visible || t < o.start || t > o.end) continue;
        const pe = KS.pool.get(o.id, o.mediaId);
        if (pe) out.push({ entry: pe, target: KS.mix.overlaySrcTime(o, t), rate: 1, gain: KS.mix.overlayGain(o, t) });
      }
      if (KS.exporter && KS.exporter.hq) return out; // export mixes sound offline; don't seek audio elements
      for (const a of KS.project.audio) {
        if (t < a.start || t > KS.mix.audioEnd(a)) continue;
        const pe = KS.pool.get(a.id, a.mediaId);
        if (pe) out.push({ entry: pe, target: KS.mix.audioSrcTime(a, t), rate: 1, gain: KS.mix.audioGain(a, t) });
      }
      return out;
    },

    /* Brings every element in line with the clock. */
    sync(playing) {
      const list = this.needed(this.t);
      const keep = new Set(list.map((n) => n.entry.owner));
      for (const n of list) {
        const el = n.entry.el;
        if (el.playbackRate !== n.rate) el.playbackRate = n.rate;
        KS.audio.setGain(n.entry, n.gain);
        const drift = Math.abs(el.currentTime - n.target);
        if (n.reverse) {
          if (!el.paused) el.pause();
          if (drift > 0.02 && el.readyState >= 1 && (!playing || !el.seeking)) el.currentTime = n.target;
          continue;
        }
        if (playing) {
          if (el.paused) {
            if (drift > 0.05) el.currentTime = n.target;
            const pr = el.play();
            if (pr && pr.catch) pr.catch(() => {});
          } else if (drift > 0.3 && !el.seeking) {
            el.currentTime = n.target;
          }
        } else {
          if (!el.paused) el.pause();
          if (drift > 0.005 && el.readyState >= 1) el.currentTime = n.target;
        }
      }
      // Warm up the next clip so the cut is instant.
      const lay = S().layout();
      const cur = S().entryAt(this.t, lay);
      const next = cur && lay[cur.index + 1];
      if (next && next.clip.kind === 'video' && next.start - this.t < 1.5) {
        const pe = KS.pool.get(next.clip.id, next.clip.mediaId);
        if (pe && !keep.has(pe.owner)) {
          keep.add(pe.owner);
          if (!pe.el.paused) pe.el.pause();
          KS.audio.setGain(pe, 0);
          const first = next.clip.reverse ? Math.max(0, S().outPoint(next.clip) - 0.001) : next.clip.trimIn;
          if (Math.abs(pe.el.currentTime - first) > 0.05 && pe.el.readyState >= 1) pe.el.currentTime = first;
        }
      }
      KS.pool.pauseAll(keep);
      return list;
    },

    /* True while a visible video is still loading, so the clock waits instead of racing ahead. */
    stalled() {
      const lay = S().layout();
      for (const e of S().at(this.t, lay)) {
        if (e.clip.kind !== 'video' || e.clip.reverse) continue;
        const pe = KS.pool.peek(e.clip.id);
        if (pe && (pe.el.readyState < 3 || pe.el.seeking)) return true;
      }
      return false;
    },

    tick(now) {
      if (!this.playing) { this.last = now; return; }
      const dt = Math.min(0.25, (now - this.last) / 1000);
      this.last = now;
      if (this.stalled()) {
        if (!this.stallSince) this.stallSince = now;
        if (now - this.stallSince < 1500) { this.sync(true); return; }
      } else this.stallSince = 0;
      this.t += dt;
      if (this.t >= this.duration - 0.001) { this.onEnd(); return; }
      this.sync(true);
      KS.requestRender();
      KS.emit('time', this.t);
    },

    onEnd() {
      if (KS.ui.loop && !(KS.exporter && KS.exporter.active) && !(KS.recorder && KS.recorder.active)) {
        this.seek(0);
        this.sync(true);
      } else {
        this.t = this.duration;
        this.pause();
        KS.emit('time', this.t);
        KS.emit('ended');
      }
    },
  });
  void P;
})();
