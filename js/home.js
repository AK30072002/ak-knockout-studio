/* AK Knockout Studio — start screen
 *
 * Asks what to make first (Video, Photo or Collage), like a phone editor,
 * and lists the drafts that were saved automatically.
 */
(function () {
  'use strict';
  const KS = window.KS;
  const $ = (id) => document.getElementById(id);

  const ago = (t) => {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    if (s < 86400 * 7) return `${Math.floor(s / 86400)} day${s < 172800 ? '' : 's'} ago`;
    return new Date(t).toLocaleDateString();
  };
  const MODE = { video: 'Video', photo: 'Photo', collage: 'Collage' };

  const H = (KS.home = {
    aspect: 'auto',
    show() {
      KS.ui.home = true;
      document.body.classList.add('at-home');
      $('home').hidden = false;
      $('homeContinue').hidden = !KS.history.canUndo() && !this._hasOpen;
      this.renderDrafts();
      setTimeout(() => { const b = $('home').querySelector('.create-card'); if (b) b.focus(); }, 30);
    },
    hide() {
      KS.ui.home = false;
      this._hasOpen = true;
      document.body.classList.remove('at-home');
      $('home').hidden = true;
      KS.app.layoutStage();
    },

    async renderDrafts() {
      const list = await KS.drafts.list();
      const grid = $('draftGrid');
      grid.innerHTML = '';
      $('draftCount').textContent = list.length ? `(${list.length})` : '';
      $('draftEmpty').hidden = list.length > 0;
      for (const d of list) {
        const card = document.createElement('div');
        card.className = 'draft';
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'draft-open';
        open.setAttribute('aria-label', `Open ${d.name}`);
        const th = document.createElement('div');
        th.className = 'draft-thumb';
        if (d.thumb) th.style.backgroundImage = `url(${d.thumb})`;
        th.style.aspectRatio = `${d.w || 16} / ${d.h || 9}`;
        const badge = document.createElement('span');
        badge.className = 'draft-badge ' + d.mode;
        badge.textContent = MODE[d.mode] || 'Video';
        th.append(badge);
        if (d.mode === 'video' && d.duration) {
          const du = document.createElement('span');
          du.className = 'draft-dur';
          du.textContent = KS.fmtTime(d.duration, 30).slice(0, 5);
          th.append(du);
        }
        const name = document.createElement('span');
        name.className = 'draft-name';
        name.textContent = d.name;
        const meta = document.createElement('span');
        meta.className = 'draft-meta';
        meta.textContent = `${ago(d.updatedAt)} · ${d.w} × ${d.h}`;
        open.append(th, name, meta);
        open.addEventListener('click', () => KS.app.openDraft(d.id));
        const more = document.createElement('div');
        more.className = 'draft-actions';
        const dup = document.createElement('button');
        dup.type = 'button'; dup.className = 'btn small'; dup.textContent = 'Duplicate';
        dup.addEventListener('click', async () => { await KS.drafts.duplicate(d.id); this.renderDrafts(); });
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'btn small danger'; del.textContent = 'Delete';
        del.addEventListener('click', async () => {
          if (!confirm(`Delete the draft “${d.name}”? This can't be undone. Your original files are not touched.`)) return;
          await KS.drafts.remove(d.id);
          if (KS.project.id === d.id) { this._hasOpen = false; KS.history.reset(); }
          this.renderDrafts();
        });
        more.append(dup, del);
        card.append(open, more);
        grid.append(card);
      }
      const u = await KS.drafts.usage();
      $('draftUsage').textContent = u && u.usage ? `Drafts, with copies of their videos and music, use ${(u.usage / 1048576).toFixed(u.usage > 1e9 ? 0 : 1)} MB on this computer.` : '';
    },

    init() {
      const pick = (id, fn) => {
        const inp = $(id);
        inp.addEventListener('change', () => { const fs = [...inp.files]; inp.value = ''; if (fs.length) fn(fs); });
        return () => inp.click();
      };
      const video = pick('homeVideoFiles', (fs) => KS.app.startNew('video', fs, { aspect: this.aspect }));
      const photo = pick('homePhotoFile', (fs) => KS.app.startNew('photo', fs));
      const collage = pick('homeCollageFiles', (fs) => KS.app.startNew('collage', fs));
      $('newVideo').addEventListener('click', video);
      $('newPhoto').addEventListener('click', photo);
      $('newCollage').addEventListener('click', collage);
      $('homeEmptyVideo').addEventListener('click', () => KS.app.startNew('video', [], { aspect: this.aspect }));
      $('homeDemo').addEventListener('click', () => KS.app.startNew('video', [], { demo: true }));
      $('homeOpen').addEventListener('click', () => $('fileProject').click());
      $('homeContinue').addEventListener('click', () => this.hide());
      $('homeHelp').addEventListener('click', () => $('helpDlg').showModal());
      $('homeAspect').querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          this.aspect = b.dataset.a;
          $('homeAspect').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        });
      });
      // dropping files on the start screen starts the matching project
      const home = $('home');
      home.addEventListener('dragover', (e) => { e.preventDefault(); home.classList.add('is-drop'); });
      home.addEventListener('dragleave', (e) => { if (!home.contains(e.relatedTarget)) home.classList.remove('is-drop'); });
      home.addEventListener('drop', (e) => {
        e.preventDefault();
        home.classList.remove('is-drop');
        const fs = [...(e.dataTransfer.files || [])];
        if (!fs.length) return;
        if (fs.some((f) => KS.mediaKind(f) === 'project')) { KS.app.openProject(fs.find((f) => KS.mediaKind(f) === 'project')); return; }
        const kinds = fs.map((f) => KS.mediaKind(f));
        if (kinds.includes('video') || kinds.includes('audio')) KS.app.startNew('video', fs, { aspect: this.aspect });
        else if (fs.length === 1) KS.app.startNew('photo', fs);
        else KS.app.startNew('collage', fs);
      });
      KS.on('drafts', () => { if (KS.ui.home) this.renderDrafts(); });
    },
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => H.init());
  else H.init();
})();
