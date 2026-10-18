/* AK Knockout Studio — timeline: ruler, overlay and text bars, video track, audio tracks */
(function () {
  'use strict';
  const KS = window.KS;
  const $ = (id) => document.getElementById(id);

  const T = (KS.timeline = {
    pps: 80, labelW: 156, thumbGen: 0, thumbCache: {}, clipEls: {},

    init() {
      this.scroll = $('tlScroll');
      this.content = $('tlContent');
      this.rows = $('tlRows');
      this.playhead = $('tlPlayhead');
      this.ruler = $('tlRuler');
      this.rctx = this.ruler.getContext('2d');
      this.zoom = $('tlZoom');
      this.thumbVideo = document.createElement('video');
      this.thumbVideo.muted = true;
      this.thumbVideo.preload = 'auto';
      this.thumbVideo.playsInline = true;

      this.zoom.addEventListener('input', () => this.setZoom(Number(this.zoom.value)));
      $('tlFit').addEventListener('click', () => this.fit());
      $('tlSnap').addEventListener('change', (e) => { KS.ui.snapping = e.target.checked; });
      this.scroll.addEventListener('scroll', () => this.drawRuler());
      this.scroll.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        this.setZoom(this.pps * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX);
      }, { passive: false });

      // scrub on ruler
      const scrub = (e) => {
        const r = this.ruler.getBoundingClientRect();
        KS.player.pause();
        KS.player.seek((e.clientX - r.left + this.scroll.scrollLeft) / this.pps);
      };
      this.ruler.addEventListener('pointerdown', (e) => {
        this.ruler.setPointerCapture(e.pointerId);
        scrub(e);
        const move = (ev) => scrub(ev);
        const up = () => { this.ruler.removeEventListener('pointermove', move); this.ruler.removeEventListener('pointerup', up); };
        this.ruler.addEventListener('pointermove', move);
        this.ruler.addEventListener('pointerup', up);
      });
      // click on empty lane space seeks
      this.rows.addEventListener('pointerdown', (e) => {
        if (!e.target.classList.contains('tl-lane')) return;
        const r = e.target.getBoundingClientRect();
        KS.player.pause();
        KS.player.seek((e.clientX - r.left) / this.pps);
      });

      new ResizeObserver(() => this.drawRuler()).observe(this.scroll);
      KS.on('project', () => { this.build(); this.thumbsSoon(); });
      KS.on('source', () => { this.build(); this.thumbsSoon(); });
      KS.on('duration', () => { this.build(); this.thumbsSoon(); });
      KS.on('select', () => this.markSelected());
      KS.on('layers', () => { this.build(); this.thumbsSoon(); });
      KS.on('time', () => this.updatePlayhead(true));
    },

    get dur() { return KS.player.duration; },

    setZoom(pps, anchorClientX) {
      const old = this.pps;
      this.pps = KS.clamp(pps, 2, 600);
      this.zoom.value = Math.round(this.pps);
      let anchorT = KS.player.t;
      let anchorX = null;
      if (anchorClientX != null) {
        const r = this.ruler.getBoundingClientRect();
        anchorX = anchorClientX - r.left;
        anchorT = (anchorX + this.scroll.scrollLeft) / old;
      }
      this.build();
      if (anchorX != null) this.scroll.scrollLeft = anchorT * this.pps - anchorX;
      this.thumbsSoon();
    },

    fit() {
      const avail = Math.max(200, this.scroll.clientWidth - this.labelW - 40);
      this.setZoom(avail / this.dur);
      this.scroll.scrollLeft = 0;
    },

    snap(v, exceptId) {
      if (!KS.ui.snapping) return v;
      const th = 8 / this.pps;
      const P = KS.project;
      const cands = [0, this.dur, KS.player.t];
      [...P.texts, ...P.overlays].forEach((L) => { if (L.id !== exceptId) cands.push(L.start, L.end); });
      KS.seq.layout().forEach((e) => cands.push(e.start, e.end));
      P.audio.forEach((a) => { if (a.id !== exceptId) cands.push(a.start, KS.mix.audioEnd(a)); });
      let best = v, bd = th;
      for (const c of cands) { const d = Math.abs(c - v); if (d < bd) { bd = d; best = c; } }
      return best;
    },

    rowEl(label, cls, onLabelClick) {
      const row = document.createElement('div');
      row.className = 'tl-row ' + (cls || '');
      const lab = document.createElement('button');
      lab.className = 'tl-label';
      lab.type = 'button';
      lab.textContent = label;
      lab.addEventListener('click', onLabelClick);
      const lane = document.createElement('div');
      lane.className = 'tl-lane';
      lane.style.width = this.dur * this.pps + 'px';
      row.append(lab, lane);
      this.rows.append(row);
      return lane;
    },

    timedBar(lane, item, cls, label) {
      const bar = document.createElement('div');
      bar.className = `tl-bar ${cls}` + (item.visible === false ? ' is-hidden' : '') + (item.locked ? ' is-locked' : '');
      bar.dataset.id = item.id;
      bar.innerHTML = '<span class="h l"></span><span class="tl-bar-name"></span><span class="h r"></span>';
      bar.querySelector('.tl-bar-name').textContent = label;
      this.placeBar(bar, item.start, item.end);
      this.bindBar(bar, item);
      lane.append(bar);
      return bar;
    },

    build() {
      const D = this.dur;
      this.content.style.width = this.labelW + D * this.pps + 60 + 'px';
      this.rows.innerHTML = '';
      const P = KS.project;

      // overlays that sit above the text, then text layers, then overlays below text (top-most first)
      const ovRow = (O) => {
        const lane = this.rowEl(O.name, 'is-overlay', () => KS.select(O.id));
        this.timedBar(lane, O, 'overlay', `${O.name} · ${O.kind === 'video' ? 'Video' : 'Picture'}`);
      };
      [...P.overlays].reverse().filter((O) => O.above).forEach(ovRow);
      [...P.texts].reverse().forEach((L) => {
        const lane = this.rowEl(L.name, 'is-text', () => KS.select(L.id));
        this.timedBar(lane, L, 'text', `${L.name} · ${KS.ANIM_LABEL[L.anim.type] || ''}`);
      });
      [...P.overlays].reverse().filter((O) => !O.above).forEach(ovRow);

      // background
      const bgLane = this.rowEl('Background', 'is-bg', () => KS.select('background'));
      const bg = document.createElement('div');
      bg.className = 'tl-bar bg';
      bg.dataset.id = 'background';
      bg.textContent = { color: 'Colour', gradient: 'Gradient', image: 'Image', 'video-blur': 'Blurred video', none: 'None' }[P.background.type] || '';
      this.placeBar(bg, 0, D);
      bg.addEventListener('pointerdown', (e) => { e.stopPropagation(); KS.select('background'); });
      bgLane.append(bg);

      // main video track
      const vLane = this.rowEl('Video', 'is-src', () => { const e = KS.player.entry(); if (e) KS.select(e.clip.id); });
      vLane.classList.add('video-lane');
      this.clipEls = {};
      const lay = KS.seq.layout();
      lay.forEach((e) => {
        const c = e.clip;
        const bar = document.createElement('div');
        bar.className = 'tl-bar clip';
        bar.dataset.id = c.id;
        bar.innerHTML = '<span class="h l"></span><span class="tl-bar-name"></span><span class="h r"></span>';
        const tag = c.kind === 'video' ? (KS.mediaLib.get(c.mediaId) ? '' : ' · offline') : c.kind === 'image' ? ' · photo' : c.kind === 'color' ? ' · colour' : '';
        bar.querySelector('.tl-bar-name').textContent = c.name + (c.speed !== 1 && c.kind === 'video' ? ` · ${c.speed}×` : '') + tag;
        const th = this.thumbCache[c.id];
        if (th) bar.style.backgroundImage = `url(${th.url})`;
        if (c.kind === 'color') bar.style.backgroundColor = c.color;
        this.placeBar(bar, e.start, e.end);
        this.bindClip(bar, c);
        vLane.append(bar);
        this.clipEls[c.id] = bar;
        if (e.index > 0) {
          const tr = document.createElement('button');
          tr.type = 'button';
          const on = e.tin > 0;
          tr.className = 'tl-tr' + (on ? ' on' : '');
          tr.title = on ? `Transition: ${(KS.TRANSITIONS.find((x) => x[0] === c.transition.type) || [])[1]} (${KS.fmtSec(e.tin)})` : 'Add a transition';
          tr.setAttribute('aria-label', tr.title);
          tr.textContent = on ? '⇄' : '+';
          tr.style.left = (e.start + e.tin / 2) * this.pps + 'px';
          tr.addEventListener('pointerdown', (ev) => ev.stopPropagation());
          tr.addEventListener('click', () => { KS.select(c.id); KS.emit('focus-section', 'Transition'); });
          vLane.append(tr);
        }
      });

      // audio tracks
      P.audio.forEach((a) => {
        const lane = this.rowEl(a.name, 'is-audio', () => KS.select(a.id));
        const bar = document.createElement('div');
        bar.className = 'tl-bar audio' + (a.muted ? ' is-hidden' : '') + (KS.mediaLib.get(a.mediaId) ? '' : ' is-offline');
        bar.dataset.id = a.id;
        bar.innerHTML = '<span class="h l"></span><span class="tl-bar-name"></span><span class="h r"></span>';
        bar.querySelector('.tl-bar-name').textContent = a.name + (a.loop ? ' · loop' : '') + (KS.mediaLib.get(a.mediaId) ? '' : ' · offline');
        this.placeBar(bar, a.start, KS.mix.audioEnd(a));
        this.bindAudio(bar, a);
        lane.append(bar);
      });

      this.markSelected();
      this.drawRuler();
      this.updatePlayhead(false);
    },

    placeBar(bar, s, e) {
      const D = this.dur;
      const a = KS.clamp(s, 0, D), b = KS.clamp(e, 0, D);
      bar.style.left = a * this.pps + 'px';
      bar.style.width = Math.max(4, (b - a) * this.pps) + 'px';
    },

    markSelected() {
      this.rows.querySelectorAll('.tl-bar').forEach((b) => b.classList.toggle('is-selected', b.dataset.id === KS.ui.selected));
    },

    /* generic drag helper: mode is 'l', 'r' or 'm' depending on where the bar was grabbed */
    drag(bar, e, onMove, onEnd) {
      const r = bar.getBoundingClientRect();
      const x = e.clientX - r.left;
      const edge = Math.min(10, r.width / 3);
      const mode = x < edge ? 'l' : x > r.width - edge ? 'r' : 'm';
      const x0 = e.clientX;
      let moved = false;
      bar.setPointerCapture(e.pointerId);
      bar.classList.add('is-dragging');
      const move = (ev) => {
        if (Math.abs(ev.clientX - x0) > 2) moved = true;
        if (moved) onMove(mode, (ev.clientX - x0) / this.pps, ev);
      };
      const up = (ev) => {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
        bar.removeEventListener('pointercancel', up);
        bar.classList.remove('is-dragging');
        onEnd(moved, mode, ev);
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    },

    /* text layers and overlays: move, or drag an edge to change start / end */
    bindBar(bar, L) {
      bar.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        KS.select(L.id);
        const f = KS.find(L.id);
        const layer = f && f.obj;
        if (!layer || layer.locked) return;
        const s0 = layer.start, e0 = layer.end, D = this.dur;
        this.drag(bar, e, (mode, dt) => {
          let ns = s0, ne = e0;
          if (mode === 'm') {
            const len = e0 - s0;
            ns = this.snap(s0 + dt, layer.id);
            const endSnap = this.snap(s0 + dt + len, layer.id);
            if (endSnap !== s0 + dt + len && ns === s0 + dt) ns = endSnap - len;
            ns = KS.clamp(ns, 0, Math.max(0, D - len));
            ne = ns + len;
          } else if (mode === 'l') {
            ns = KS.clamp(this.snap(s0 + dt, layer.id), 0, e0 - 0.1);
          } else {
            ne = KS.clamp(this.snap(e0 + dt, layer.id), s0 + 0.1, D);
          }
          layer.start = Math.round(ns * 1000) / 1000;
          layer.end = Math.round(ne * 1000) / 1000;
          this.placeBar(bar, layer.start, layer.end);
          KS.requestRender();
        }, (moved) => { if (moved) { KS.commit(); KS.emit('refresh-inspector'); } });
      });
      bar.addEventListener('dblclick', () => KS.emit('focus-text'));
    },

    /* clips: drag an edge to trim, drag the middle to reorder */
    bindClip(bar, c) {
      bar.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        KS.select(c.id);
        KS.player.pause();
        const i0 = c.trimIn, o0 = KS.seq.outPoint(c), d0 = c.duration, srcD = KS.seq.srcLen(c);
        const isVideo = c.kind === 'video';
        let ghost = null;
        this.drag(bar, e, (mode, dt, ev) => {
          if (mode === 'm') {
            bar.style.transform = `translateX(${dt * this.pps}px)`;
            bar.style.zIndex = 5;
            ghost = ev.clientX;
            return;
          }
          if (isVideo) {
            if (mode === 'l') c.trimIn = Math.round(KS.clamp(i0 + dt * c.speed, 0, o0 - 0.1) * 1000) / 1000;
            else c.trimOut = Math.round(KS.clamp(o0 + dt * c.speed, c.trimIn + 0.1, srcD) * 1000) / 1000;
          } else {
            c.duration = Math.round(KS.clamp(d0 + (mode === 'l' ? -dt : dt), 0.2, 3600) * 100) / 100;
          }
          this.relayoutClips();
          KS.requestRender();
        }, (moved, mode) => {
          bar.style.transform = ''; bar.style.zIndex = '';
          if (!moved) return;
          if (mode === 'm' && ghost != null) {
            const lanes = this.rows.querySelector('.video-lane').getBoundingClientRect();
            const t = (ghost - lanes.left) / this.pps;
            const lay = KS.seq.layout();
            const arr = KS.project.clips;
            const from = arr.indexOf(c);
            let to = lay.filter((x) => x.clip !== c && (x.start + x.end) / 2 < t).length;
            if (to !== from) {
              arr.splice(from, 1);
              arr.splice(to, 0, c);
              KS.commit(); KS.emit('layers'); KS.emit('duration');
              KS.toast(`Moved “${c.name}” to position ${to + 1}.`, 1800);
            } else this.build();
            return;
          }
          KS.commit(); KS.emit('duration'); KS.emit('refresh-inspector');
        });
      });
    },

    relayoutClips() {
      KS.seq.layout().forEach((e) => { const b = this.clipEls[e.clip.id]; if (b) this.placeBar(b, e.start, e.end); });
    },

    /* audio: move, or drag the left edge to cut the start and the right edge to cut the end */
    bindAudio(bar, a) {
      bar.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        KS.select(a.id);
        const s0 = a.start, i0 = a.trimIn, len0 = KS.mix.audioLen(a);
        const m = KS.mediaLib.get(a.mediaId), srcD = m ? m.duration : a.srcDuration || len0 + i0;
        this.drag(bar, e, (mode, dt) => {
          if (mode === 'm') a.start = Math.round(Math.max(0, this.snap(s0 + dt, a.id)) * 1000) / 1000;
          else if (mode === 'l') {
            const d = KS.clamp(dt, -Math.min(i0, s0), len0 - 0.1);
            a.start = Math.round((s0 + d) * 1000) / 1000;
            a.trimIn = Math.round((i0 + d) * 1000) / 1000;
          } else {
            a.trimOut = Math.round(KS.clamp(i0 + len0 + dt, a.trimIn + 0.1, srcD) * 1000) / 1000;
          }
          this.placeBar(bar, a.start, KS.mix.audioEnd(a));
        }, (moved) => { if (moved) { KS.commit(); KS.emit('refresh-inspector'); KS.player.sync(KS.player.playing); } });
      });
    },

    updatePlayhead(follow) {
      const x = KS.player.t * this.pps;
      this.playhead.style.transform = `translateX(${this.labelW + x}px)`;
      if (follow && KS.player.playing) {
        const vis = this.scroll.clientWidth - this.labelW;
        const sl = this.scroll.scrollLeft;
        if (x > sl + vis - 30 || x < sl) this.scroll.scrollLeft = Math.max(0, x - 40);
      }
      this.drawRuler();
    },

    drawRuler() {
      const cv = this.ruler, dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      }
      const c = this.rctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const sl = this.scroll.scrollLeft, pps = this.pps, D = this.dur;
      const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
      const major = steps.find((s) => s * pps >= 72) || 600;
      const minor = major / 5;
      const css = getComputedStyle(document.documentElement);
      c.fillStyle = css.getPropertyValue('--line').trim() || '#444';
      c.fillRect(0, h - 1, w, 1);
      const i0 = Math.floor(sl / pps / minor);
      const i1 = Math.ceil((sl + w) / pps / minor) + 1;
      c.font = '10px ' + (css.getPropertyValue('--mono').trim() || 'monospace');
      c.textBaseline = 'top';
      for (let i = i0; i <= i1; i++) {
        const t = Math.round(i * minor * 1000) / 1000;
        const x = Math.round(t * pps - sl) + 0.5;
        const isMajor = i % 5 === 0;
        c.fillStyle = isMajor ? (css.getPropertyValue('--muted').trim() || '#aaa') : (css.getPropertyValue('--faint').trim() || '#666');
        c.fillRect(x, isMajor ? h - 11 : h - 6, 1, isMajor ? 10 : 5);
        if (isMajor && t >= 0) {
          const m = Math.floor(t / 60 + 1e-9), s = Math.round((t - m * 60) * 10) / 10;
          const label = major < 1 ? s.toFixed(1) : `${m}:${String(Math.round(s)).padStart(2, '0')}`;
          c.fillText(label, x + 4, 4);
        }
      }
      // shade past the end
      const endX = D * pps - sl;
      if (endX < w) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(Math.max(0, endX), 0, w, h); }
      // playhead marker
      const px = KS.player.t * pps - sl;
      if (px >= -6 && px <= w + 6) {
        c.fillStyle = css.getPropertyValue('--accent').trim() || '#f44336';
        c.beginPath();
        c.moveTo(px - 6, 0); c.lineTo(px + 6, 0); c.lineTo(px + 6, h - 8); c.lineTo(px, h); c.lineTo(px - 6, h - 8);
        c.closePath(); c.fill();
      }
    },

    /* ---------- filmstrip thumbnails, one strip per clip ---------- */
    thumbsSoon() { clearTimeout(this._tt); this._tt = setTimeout(() => this.thumbs(), 350); },

    async thumbs() {
      const gen = ++this.thumbGen;
      const P = KS.project;
      const th = 40, tw = Math.round(th * (P.canvas.w / P.canvas.h));
      for (const e of KS.seq.layout()) {
        if (gen !== this.thumbGen) return;
        const c = e.clip;
        const barW = Math.min(4000, Math.max(20, e.len * this.pps));
        const n = KS.clamp(Math.ceil(barW / tw), 1, 40);
        const key = [c.kind, c.mediaId, c.assetId, c.color, c.trimIn, KS.seq.outPoint(c), n, tw].join('|');
        if (this.thumbCache[c.id] && this.thumbCache[c.id].key === key) continue;
        const cv = document.createElement('canvas');
        cv.width = n * tw; cv.height = th;
        const ctx = cv.getContext('2d');
        const cell = (img, i, sw, sh) => {
          const s = Math.max(tw / sw, th / sh);
          ctx.save(); ctx.beginPath(); ctx.rect(i * tw, 0, tw, th); ctx.clip();
          ctx.drawImage(img, i * tw + (tw - sw * s) / 2, (th - sh * s) / 2, sw * s, sh * s);
          ctx.restore();
        };
        const m = c.kind === 'video' && KS.mediaLib.get(c.mediaId);
        if (m) {
          const v = this.thumbVideo;
          if (v.src !== m.url) {
            v.src = m.url;
            await new Promise((r) => { v.onloadeddata = r; v.onerror = r; setTimeout(r, 3000); });
          }
          for (let i = 0; i < n; i++) {
            if (gen !== this.thumbGen) return;
            const t = c.trimIn + ((i + 0.5) / n) * e.len * c.speed;
            await new Promise((r) => {
              const done = () => { v.removeEventListener('seeked', done); r(); };
              v.addEventListener('seeked', done);
              setTimeout(done, 800);
              v.currentTime = Math.min(t, (v.duration || t) - 0.05);
            });
            if (v.videoWidth) cell(v, i, v.videoWidth, v.videoHeight);
          }
        } else if (c.kind === 'image' && KS.assets[c.assetId]) {
          const img = KS.assets[c.assetId].img;
          for (let i = 0; i < n; i++) cell(img, i, img.naturalWidth, img.naturalHeight);
        } else if (c.kind === 'demo') {
          const R = KS.renderer;
          for (let i = 0; i < n; i++) { R.drawDemo(((i + 0.5) / n) * e.len); cell(R.demo, i, R.demo.width, R.demo.height); }
        } else continue;
        if (gen !== this.thumbGen) return;
        this.thumbCache[c.id] = { key, url: cv.toDataURL('image/jpeg', 0.7) };
        const bar = this.clipEls && this.clipEls[c.id];
        if (bar) bar.style.backgroundImage = `url(${this.thumbCache[c.id].url})`;
      }
    },
  });
  void T;
})();
