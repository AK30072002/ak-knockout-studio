/* AK Knockout Studio — motion engine (scrolls, entrances, loops, fades) */
(function () {
  'use strict';
  const KS = window.KS;
  const TAU = Math.PI * 2;

  function easeOutBounce(x) {
    const n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }

  KS.EASE = {
    linear: (t) => t,
    'ease-in': (t) => t * t * t,
    'ease-out': (t) => 1 - Math.pow(1 - t, 3),
    'ease-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    bounce: easeOutBounce,
  };
  KS.EASE_OPTIONS = [
    ['linear', 'Linear (constant)'], ['ease-in', 'Ease in'], ['ease-out', 'Ease out'],
    ['ease-in-out', 'Ease in and out'], ['back', 'Overshoot'], ['bounce', 'Bounce'],
  ];

  /* Motion catalogue. `kind` decides which controls the inspector shows. */
  KS.ANIM_GROUPS = [
    { label: 'No motion', items: [['none', 'Static', 'static']] },
    {
      label: 'Scroll',
      items: [
        ['scroll-up', 'Scroll up (credits roll)', 'scroll'],
        ['scroll-down', 'Scroll down', 'scroll'],
        ['scroll-left', 'Scroll left (ticker)', 'scroll'],
        ['scroll-right', 'Scroll right', 'scroll'],
        ['scroll-diag-up', 'Diagonal, bottom-left to top-right', 'scroll'],
        ['scroll-diag-down', 'Diagonal, top-left to bottom-right', 'scroll'],
        ['marquee-h', 'Endless marquee, horizontal', 'marquee'],
        ['marquee-v', 'Endless loop, vertical', 'marquee'],
        ['ping-pong', 'Ping-pong side to side', 'pingpong'],
        ['crawl', 'Perspective crawl (into the distance)', 'scroll'],
        ['zoom-through', 'Zoom-through (fly into the text)', 'scroll'],
      ],
    },
    {
      label: 'Entrance',
      items: [
        ['slide-left', 'Slide in from left', 'entrance'],
        ['slide-right', 'Slide in from right', 'entrance'],
        ['slide-up', 'Slide in from bottom', 'entrance'],
        ['slide-down', 'Slide in from top', 'entrance'],
        ['zoom-in', 'Zoom in', 'entrance'],
        ['zoom-out', 'Zoom out (shrink into place)', 'entrance'],
        ['bounce', 'Drop and bounce', 'entrance'],
        ['typewriter', 'Typewriter', 'entrance'],
        ['letters', 'Letter-by-letter fade', 'entrance'],
        ['wipe', 'Wipe reveal', 'entrance'],
      ],
    },
    {
      label: 'Continuous',
      items: [
        ['pulse', 'Pulse', 'loop'],
        ['wave', 'Wave', 'loop'],
        ['float', 'Float', 'loop'],
        ['spin', 'Spin', 'loop'],
        ['shake', 'Shake', 'loop'],
      ],
    },
  ];
  KS.ANIM_KIND = {};
  KS.ANIM_LABEL = {};
  KS.ANIM_GROUPS.forEach((g) => g.items.forEach(([v, l, k]) => { KS.ANIM_KIND[v] = k; KS.ANIM_LABEL[v] = l; }));

  /* Sensible defaults applied when the motion type changes. */
  KS.animDefaultsFor = (type) => {
    const kind = KS.ANIM_KIND[type];
    if (kind === 'scroll') return { ease: 'linear', timing: 'duration', repeats: 1, fadeIn: 0, fadeOut: 0 };
    if (kind === 'marquee') return { speed: 220, fadeIn: 0, fadeOut: 0 };
    if (kind === 'pingpong') return { speed: 260, amount: 1, ease: 'ease-in-out' };
    if (type === 'zoom-in') return { ease: 'back', inDur: 1.2 };
    if (type === 'bounce') return { ease: 'bounce', inDur: 1.4 };
    if (type === 'typewriter') return { ease: 'linear', inDur: 2 };
    if (kind === 'entrance') return { ease: 'ease-out', inDur: 1.2 };
    if (kind === 'loop') return { freq: type === 'spin' ? 0.15 : 0.6, amount: 1 };
    return {};
  };

  /* Progress 0..1 for travelling motions. Handles "fit to clip" and "fixed speed". */
  KS.cycleProgress = (a, lt, dur, dist, speedPx) => {
    let p;
    if (a.timing === 'speed') {
      p = dist > 0 ? (lt * speedPx) / dist : 1;
      p = a.loop ? p % 1 : Math.min(p, 1);
    } else {
      const reps = Math.max(1, Math.round(a.repeats || 1));
      p = (lt / Math.max(0.001, dur)) * reps;
      p = p >= reps ? 1 : p % 1;
    }
    return (KS.EASE[a.ease] || KS.EASE.linear)(p);
  };

  const hash = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };

  /*
   * Returns the animated state of a text layer at output time t, or null when hidden.
   * box = { cx, cy, w, h, lineH, nChars } in canvas pixels; k = resolution scale.
   */
  KS.computeAnim = (L, t, W, H, box, k) => {
    if (!L.visible || t < L.start || t > L.end + 1e-6) return null;
    const a = L.anim;
    const lt = t - L.start;
    const dur = Math.max(0.001, L.end - L.start);
    const st = { dx: 0, dy: 0, scale: 1, rot: 0, alpha: 1, chars: Infinity, wipe: 1, charFn: null, tile: null, crawl: null };

    if (a.fadeIn > 0) st.alpha *= KS.clamp(lt / a.fadeIn, 0, 1);
    if (a.fadeOut > 0) st.alpha *= KS.clamp((dur - lt) / a.fadeOut, 0, 1);

    const { cx, cy, w, h } = box;
    const spd = a.speed * k;
    const inP = KS.clamp(lt / Math.max(0.01, a.inDur), 0, 1);
    const ein = (KS.EASE[a.ease] || KS.EASE['ease-out'])(inP);
    const f = a.freq, amt = a.amount;
    let p;

    switch (a.type) {
      case 'scroll-up':
        p = KS.cycleProgress(a, lt, dur, H + h, spd);
        st.dy = KS.lerp(H + h / 2, -h / 2, p) - cy; break;
      case 'scroll-down':
        p = KS.cycleProgress(a, lt, dur, H + h, spd);
        st.dy = KS.lerp(-h / 2, H + h / 2, p) - cy; break;
      case 'scroll-left':
        p = KS.cycleProgress(a, lt, dur, W + w, spd);
        st.dx = KS.lerp(W + w / 2, -w / 2, p) - cx; break;
      case 'scroll-right':
        p = KS.cycleProgress(a, lt, dur, W + w, spd);
        st.dx = KS.lerp(-w / 2, W + w / 2, p) - cx; break;
      case 'scroll-diag-up':
        p = KS.cycleProgress(a, lt, dur, Math.hypot(W + w, H + h), spd);
        st.dx = KS.lerp(-w / 2, W + w / 2, p) - cx;
        st.dy = KS.lerp(H + h / 2, -h / 2, p) - cy; break;
      case 'scroll-diag-down':
        p = KS.cycleProgress(a, lt, dur, Math.hypot(W + w, H + h), spd);
        st.dx = KS.lerp(-w / 2, W + w / 2, p) - cx;
        st.dy = KS.lerp(-h / 2, H + h / 2, p) - cy; break;
      case 'marquee-h': {
        const step = Math.max(8, w + a.gap * k);
        const off = (lt * spd) % step;
        st.tile = { axis: 'x', step, off: a.reverse ? step - off : off }; break;
      }
      case 'marquee-v': {
        const step = Math.max(8, h + a.gap * k);
        const off = (lt * spd) % step;
        st.tile = { axis: 'y', step, off: a.reverse ? step - off : off }; break;
      }
      case 'ping-pong': {
        const amp = Math.max(20 * k, W * 0.25 * amt);
        const period = (4 * amp) / Math.max(1, spd);
        const ph = (lt / period) % 1;
        const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        st.dx = KS.lerp(-amp, amp, (KS.EASE[a.ease] || KS.EASE.linear)(tri)); break;
      }
      case 'crawl':
        st.crawl = { lt, dur }; break;
      case 'zoom-through':
        p = KS.cycleProgress(a, lt, dur, W * 4, spd);
        st.scale = Math.exp(KS.lerp(Math.log(0.35), Math.log(1 + 8 * amt), p)); break;

      case 'slide-left': st.dx = -(cx + w / 2) * (1 - ein); break;
      case 'slide-right': st.dx = (W - cx + w / 2) * (1 - ein); break;
      case 'slide-up': st.dy = (H - cy + h / 2) * (1 - ein); break;
      case 'slide-down': st.dy = -(cy + h / 2) * (1 - ein); break;
      case 'zoom-in': st.scale = Math.max(0.001, KS.lerp(0.25, 1, ein)); st.alpha *= inP; break;
      case 'zoom-out': st.scale = KS.lerp(2.6, 1, ein); st.alpha *= inP; break;
      case 'bounce': st.dy = -(cy + h / 2) * (1 - KS.EASE.bounce(inP)); break;
      case 'typewriter': st.chars = Math.floor(box.nChars * inP + 1e-6); break;
      case 'wipe': st.wipe = ein; break;
      case 'letters': {
        const N = box.nChars;
        st.charFn = (i) => ({ alpha: KS.clamp((inP * (N + 4) - i) / 4, 0, 1), dy: 0 }); break;
      }

      case 'pulse': st.scale = 1 + 0.08 * amt * Math.sin(TAU * f * lt); break;
      case 'wave': {
        const lh = box.lineH;
        st.charFn = (i) => ({ alpha: 1, dy: Math.sin(TAU * f * lt - i * 0.45) * lh * 0.12 * amt }); break;
      }
      case 'float': st.dy = Math.sin(TAU * f * lt) * 24 * amt * k; st.rot = Math.sin(TAU * f * lt * 0.5) * 0.015 * amt; break;
      case 'spin': st.rot = TAU * f * lt * (a.reverse ? -1 : 1); break;
      case 'shake': {
        const n = Math.floor(lt * 24);
        st.dx = hash(n + 1) * 12 * amt * k;
        st.dy = hash(n + 2) * 12 * amt * k;
        st.rot = hash(n + 3) * 0.02 * amt; break;
      }
      default: break;
    }
    return st;
  };
})();
