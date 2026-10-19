/* =============================================================================
   ELITE TENNIS — SPONSORSHIP PORTFOLIO
   script.js — renders content from data.js and runs the court camera.

   Canvas mode: the page keeps native scrolling. A tall, invisible scroll track
   gives the document its length; scroll position is mapped to a "progress"
   value (0 … sections-1) and the camera — a single CSS transform on .world —
   glides along the ball's flight path from one frame to the next. When the
   reader stops scrolling between two frames, the camera settles onto the
   nearer one, so a transition never freezes halfway.
   Page mode: sheets are stacked; IntersectionObserver drives reveals and the HUD.

   The deck is a document for sponsors, not a site: there are no buttons,
   menus or forms. The reader scrolls (or uses the arrow keys) and the film
   plays; the letterbox bars only report where they are.
   ========================================================================== */
(function () {
  'use strict';

  var D = (typeof PORTFOLIO !== 'undefined') ? PORTFOLIO : null;
  if (!D) { console.warn('data.js did not load — showing the static page.'); return; }

  /* ------------------------------------------------------------ helpers -- */
  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  /* sine easing: half the peak speed of a cubic ease, so moves start and land softly */
  var easeInOut = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  var isPH = function (v) { return !!v && typeof v === 'object' && v.placeholder === true; };
  var raw = function (v) { return isPH(v) ? v.value : v; };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };

  /** Renders a data value as HTML; placeholders get the dashed "to confirm" mark. */
  function show(v) {
    if (v == null || v === '') return '';
    if (isPH(v)) {
      var long = String(v.value).length > 70;
      return '<span class="ph' + (long ? ' ph--long' : '') + '" title="Placeholder: replace in data.js">' + esc(v.value) + '</span>';
    }
    return esc(v);
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  var S = D.settings || {};
  var locale = S.locale || 'en-US';
  var currency = S.currency || 'USD';
  var moneyFmt;
  try { moneyFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }); }
  catch (e) { moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }
  var money = function (n) { return moneyFmt.format(Number(n) || 0); };

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return reduceMQ.matches; };

  /* =================================================== CONTENT RENDERING == */
  var P_ = D.player || {};
  var R_ = D.ranking || {};
  var fullName = (raw(P_.firstName) || '') + ' ' + (raw(P_.lastName) || '');

  function renderBindings() {
    $$('[data-bind]').forEach(function (el) { el.innerHTML = show(getPath(D, el.getAttribute('data-bind'))); });
    $$('[data-bind-raw]').forEach(function (el) { el.textContent = raw(getPath(D, el.getAttribute('data-bind-raw'))) || ''; });
    doc.title = fullName.trim() + ' | Professional Tennis Sponsorship Portfolio';

    var rank = raw(R_.current);
    $$('[data-count]').forEach(function (el) {
      if (isFinite(rank) && !isPH(R_.current)) { el.setAttribute('data-count', rank); el.textContent = rank; }
      else { el.removeAttribute('data-count'); el.innerHTML = show(R_.current); }
    });

    if (S.showPlaceholderMarks === false) root.classList.add('hide-ph');
  }

  /* Unsplash URLs get a responsive srcset; any other URL is used as-is. */
  function srcsetFor(src) {
    if (!/images\.unsplash\.com/.test(src)) return null;
    var base = src.split('?')[0];
    return [640, 1080, 1600, 2200].map(function (w) {
      return base + '?w=' + w + '&q=72&auto=format&fit=crop ' + w + 'w';
    }).join(', ');
  }

  function renderImages() {
    var imgs = D.images || {};
    $$('[data-img]').forEach(function (fig) {
      var key = fig.getAttribute('data-img');
      var cfg = imgs[key];
      if (!cfg || !cfg.src) { fig.classList.add('is-failed'); return; }
      var img = doc.createElement('img');
      img.alt = cfg.alt || '';
      img.decoding = 'async';
      if (key === 'cover') { img.loading = 'eager'; img.setAttribute('fetchpriority', 'high'); }
      else img.loading = 'lazy';
      var set = srcsetFor(cfg.src);
      if (set) {
        img.srcset = set;
        img.sizes = fig.getAttribute('data-sizes') || '100vw';
        img.src = cfg.src.split('?')[0] + '?w=1600&q=72&auto=format&fit=crop';
      } else {
        img.src = cfg.src;
      }
      img.addEventListener('error', function () { fig.classList.add('is-failed'); });
      fig.insertBefore(img, fig.firstChild);

      if (cfg.sample) {
        var cap = doc.createElement('figcaption');
        cap.className = 'sample-note';
        cap.textContent = 'Sample photo' + (cfg.credit ? ' (' + cfg.credit + ')' : '') + ', not the player';
        fig.appendChild(cap);
      }
    });
  }

  function dlRows(rows) {
    return rows.map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + r[1] + '</dd></div>';
    }).join('');
  }

  function renderProfile() {
    $('#profile-facts').innerHTML = dlRows([
      ['Nationality', show(P_.nationality)],
      ['Age', show(P_.age)],
      ['Plays', show(P_.plays)],
      ['Playing style', show(P_.style)],
      ['Coach', show(P_.coach)],
      ['Training base', show(P_.trainingBase)]
    ]);
  }

  function renderRankings() {
    $('#rank-stats').innerHTML = (D.rankingStats || []).map(function (st) {
      return '<div><dt>' + esc(st.label) + '</dt><dd>' + show(st.value) + '</dd></div>';
    }).join('');

    $('#achievements').innerHTML = (D.achievements || []).map(function (a, i) {
      return '<li style="--i:' + i + '">' + show(a) + '</li>';
    }).join('');

    renderChart();
  }

  /* Ranking chart — native SVG. Draws only supplied history; otherwise a clean empty state. */
  function renderChart() {
    var host = $('#rank-chart');
    var W = 600, H = 300, m = { l: 52, r: 30, t: 22, b: 40 };
    var NS = 'http://www.w3.org/2000/svg';
    var hist = (D.rankingHistory || []).filter(function (d) { return d && d.date && isFinite(d.rank); })
      .slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    var parts = [];
    var current = raw(R_.current);

    if (hist.length >= 2) {
      var ranks = hist.map(function (d) { return +d.rank; });
      var best = Math.min.apply(null, ranks), worst = Math.max.apply(null, ranks);
      var span = Math.max(20, worst - best);
      var lo = Math.max(1, Math.floor((best - span * 0.12) / 10) * 10);
      var hi = Math.ceil((worst + span * 0.12) / 10) * 10;
      var times = hist.map(function (d) { var p = String(d.date).split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1).getTime(); });
      var t0 = times[0], t1 = times[times.length - 1] || t0 + 1;
      var x = function (t) { return m.l + (t - t0) / Math.max(1, t1 - t0) * (W - m.l - m.r); };
      var y = function (r) { return m.t + (r - lo) / (hi - lo) * (H - m.t - m.b); };

      for (var k = 0; k <= 3; k++) {
        var rv = Math.round(lo + (hi - lo) * k / 3);
        parts.push('<line class="axis" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(rv) + '" y2="' + y(rv) + '"/>');
        parts.push('<text class="tick" x="' + (m.l - 10) + '" y="' + (y(rv) + 4) + '" text-anchor="end">' + rv + '</text>');
      }
      var d = hist.map(function (h, i) { return (i ? 'L' : 'M') + x(times[i]).toFixed(1) + ' ' + y(h.rank).toFixed(1); }).join(' ');
      parts.push('<path class="trend" d="' + d + '"/>');
      hist.forEach(function (h, i) {
        var last = i === hist.length - 1;
        parts.push('<circle class="dot' + (last ? ' dot-now' : '') + '" cx="' + x(times[i]) + '" cy="' + y(h.rank) + '" r="' + (last ? 5 : 3.5) + '"><title>' + esc(h.date) + ': No. ' + esc(h.rank) + '</title></circle>');
      });
      parts.push('<text class="tick" x="' + m.l + '" y="' + (H - 10) + '">' + esc(hist[0].date) + '</text>');
      parts.push('<text class="tick" x="' + (W - m.r) + '" y="' + (H - 10) + '" text-anchor="end">' + esc(hist[hist.length - 1].date) + '</text>');
      host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ranking progression from ' + esc(hist[0].date) + ' (No. ' + esc(hist[0].rank) + ') to ' + esc(hist[hist.length - 1].date) + ' (No. ' + esc(hist[hist.length - 1].rank) + ')">' + parts.join('') + '</svg>';

      var path = $('.trend', host);
      var len = 0;
      for (var j = 1; j < hist.length; j++) len += Math.hypot(x(times[j]) - x(times[j - 1]), y(hist[j].rank) - y(hist[j - 1].rank));
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = reduced() ? 0 : len;
    } else {
      /* no real history yet: leave the chart out rather than show an empty frame */
      host.closest('.chart-card').hidden = true;
    }
  }

  /* ---------------------------------------------------------- results -- */
  var dateKey = function (r) { var d = raw(r.date); return isPH(r.date) || !/^\d{4}/.test(d) ? '' : String(d); };
  var resultRows = (D.results || []).slice().sort(function (a, b) { return dateKey(b).localeCompare(dateKey(a)); });
  var dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  var monthFmt = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
  function fmtDate(v) {
    if (isPH(v)) return show(v);
    var p = String(v).split('-');
    if (p.length < 2) return esc(v);
    var d = new Date(+p[0], +p[1] - 1, +p[2] || 1);
    return p.length > 2 ? dateFmt.format(d) : monthFmt.format(d);
  }

  function renderResults() {
    var rows = resultRows;
    var body = $('#results-body');
    /* a column the team has not filled for any row stays out of the document */
    var hasSurface = rows.some(function (r) { return raw(r.surface) && !isPH(r.surface); });
    if (!hasSurface) { var th = $('.results-table thead th:nth-child(4)'); if (th) th.remove(); }
    var cols = hasSurface ? 7 : 6;
    if (!rows.length) {
      body.innerHTML = '<tr class="results-empty"><td colspan="' + cols + '">Results will be listed here.</td></tr>';
    } else {
      body.innerHTML = rows.map(function (r) {
        var res = String(raw(r.result) || '');
        var m = res.match(/^([WL])\s+(.*)$/);
        var resHtml = m
          ? '<span class="wl wl--' + m[1].toLowerCase() + '" aria-hidden="true">' + m[1] + '</span><span class="visually-hidden">' + (m[1] === 'W' ? 'Won' : 'Lost') + ' </span>' + esc(m[2])
          : show(r.result);
        return '<tr>' +
          '<td data-label="Date">' + fmtDate(r.date) + '</td>' +
          '<td data-label="Tournament"><span><span class="t-name">' + show(r.tournament) + '</span>' + (r.example ? '<span class="tag-example">Example</span>' : '') + '</span></td>' +
          '<td data-label="Country">' + show(r.country) + '</td>' +
          (hasSurface ? '<td data-label="Surface">' + show(r.surface) + '</td>' : '') +
          '<td data-label="Category">' + show(r.category) + '</td>' +
          '<td data-label="Round">' + show(r.round) + '</td>' +
          '<td data-label="Result" class="t-result">' + resHtml + '</td>' +
          '</tr>';
      }).join('');
    }

    /* summary: only figures that are actually known */
    var items = [];
    var wl = D.winLoss;
    if (wl && isFinite(wl.wins) && isFinite(wl.losses)) {
      items.push('<div class="summary-item"><span class="label">Season record</span><span class="summary-val">' + wl.wins + '–' + wl.losses + '</span>' +
        (wl.season ? '<span class="summary-sub">Season ' + esc(wl.season) + '</span>' : '') + '</div>');
    }
    if (D.bestResult) {
      items.push('<div class="summary-item"><span class="label">Best result</span><span class="summary-val summary-val--text">' + show(D.bestResult) + '</span></div>');
    }
    /* a title is a final won or a round marked Champion */
    var titles = rows.filter(function (r) {
      if (r.example) return false;
      var round = String(raw(r.round) || ''), res = String(raw(r.result) || '');
      return /champion/i.test(round) || (/final/i.test(round) && /^W\b/.test(res));
    }).length;
    if (titles) {
      items.push('<div class="summary-item"><span class="label">Titles in this list</span><span class="summary-val">' + titles + '</span></div>');
    }
    var counts = {};
    rows.forEach(function (r) { if (isPH(r.surface) || !raw(r.surface)) return; var sf = raw(r.surface); counts[sf] = (counts[sf] || 0) + 1; });
    var maxC = Math.max.apply(null, Object.keys(counts).map(function (k) { return counts[k]; }).concat([1]));
    var bars = Object.keys(counts).map(function (k) {
      return '<div class="surface-bar"><span>' + esc(k) + '</span><span class="track"><span class="fill" style="transform:scaleX(' + (counts[k] / maxC) + ')"></span></span><span class="n">' + counts[k] + '</span></div>';
    }).join('');
    if (bars) items.push('<div class="summary-item"><span class="label">Events by surface</span><div class="surface-bars">' + bars + '</div></div>');

    var sum = $('#results-summary');
    sum.innerHTML = items.join('');
    sum.style.setProperty('--summary-cols', items.length === 2 ? '1.7fr 1fr' : items.length === 1 ? '1fr' : '');

    $('#results-note').textContent = rows.some(function (r) { return r.example; })
      ? 'Rows marked Example show the layout only and are not real results.' : '';
  }

  /* ------------------------------------------------------------ goals -- */
  function renderGoals() {
    $('#timeline').innerHTML = (D.goals || []).map(function (g, i) {
      return '<li class="milestone reveal" style="--i:' + (i + 2) + '">' +
        '<span class="milestone-node" aria-hidden="true" style="--i:' + i + '"></span>' +
        '<h3 class="milestone-phase">' + esc(g.phase) + '</h3>' +
        '<p class="milestone-meta">' + show(g.horizon) + '</p>' +
        '<p class="milestone-target">' + show(g.target) + '</p>' +
        '<ul class="milestone-items">' + (g.items || []).map(function (it) { return '<li>' + show(it) + '</li>'; }).join('') + '</ul>' +
        '</li>';
    }).join('');
  }

  /* ------------------------------------------------- schedule & budget -- */
  var BAR_COLORS = ['#00AFCA', '#F6C21C', '#F3EAD6', '#5F8C9B', '#7FD3E3', '#A9C1CB', '#E8963A', '#C8102E'];

  /** Pure budget calculation — exposed on window for quick checks in the console. */
  function computeBudget(data) {
    var sched = data.schedule || [];
    var sum = function (key) { return sched.reduce(function (t, e) { return t + (Number(e[key]) || 0); }, 0); };
    var travel = sum('travel'), stay = sum('accommodation'), entry = sum('entry'), other = sum('other');
    var lines = [
      { label: 'Flights and transportation', amount: travel },
      { label: 'Accommodation and meals', amount: stay },
      { label: 'Tournament entry fees', amount: entry }
    ];
    var merged = false;
    (data.annualCosts || []).forEach(function (c) {
      var amt = Number(c.amount) || 0;
      if (/^other/i.test(c.label)) { amt += other; merged = true; }
      lines.push({ label: c.label, amount: amt });
    });
    if (!merged && other) lines.push({ label: 'Other event costs', amount: other });
    var total = lines.reduce(function (t, l) { return t + l.amount; }, 0);
    var confirmed = Number((data.funding || {}).confirmed) || 0;
    var gap = Math.max(0, total - confirmed);
    var target = (data.funding && data.funding.sponsorshipTarget != null) ? Number(data.funding.sponsorshipTarget) : gap;
    return {
      lines: lines, total: total, confirmed: confirmed, gap: gap, target: target,
      schedule: { travel: travel, accommodation: stay, entry: entry, other: other, total: travel + stay + entry + other }
    };
  }
  window.computeBudget = computeBudget;

  function renderFunding() {
    var B = computeBudget(D);
    $('#estimate-tag').textContent = 'All figures are estimates in ' + currency;

    $('#schedule-body').innerHTML = (D.schedule || []).map(function (e) {
      var tot = (Number(e.travel) || 0) + (Number(e.accommodation) || 0) + (Number(e.entry) || 0) + (Number(e.other) || 0);
      return '<tr>' +
        '<td class="ev"><span class="ev-name">' + show(e.event) + '</span><span class="ev-sub">' + show(e.location) + '</span></td>' +
        '<td><span class="ev-when">' + show(e.date) + '</span><span class="ev-sub">' + show(e.surface) + '</span></td>' +
        '<td class="num">' + money(e.travel) + '</td><td class="num">' + money(e.accommodation) + '</td>' +
        '<td class="num">' + money(e.entry) + '</td><td class="num">' + money(e.other) + '</td>' +
        '<td class="num"><strong>' + money(tot) + '</strong></td></tr>';
    }).join('');
    $('#schedule-foot').innerHTML = '<tr><td colspan="2">Schedule total (estimate)</td>' +
      '<td class="num">' + money(B.schedule.travel) + '</td><td class="num">' + money(B.schedule.accommodation) + '</td>' +
      '<td class="num">' + money(B.schedule.entry) + '</td><td class="num">' + money(B.schedule.other) + '</td>' +
      '<td class="num">' + money(B.schedule.total) + '</td></tr>';

    $('#budget-total').textContent = money(B.total);
    $('#budget-lines').innerHTML =
      '<div><dt>Confirmed funding</dt><dd>' + money(B.confirmed) + '</dd></div>' +
      '<div class="is-key"><dt>Remaining funding gap</dt><dd>' + money(B.gap) + '</dd></div>' +
      '<div class="is-key"><dt>Proposed sponsorship target</dt><dd>' + money(B.target) + '</dd></div>';

    var lines = B.lines.filter(function (l) { return l.amount > 0; });
    $('#budget-bar').innerHTML = lines.map(function (l, i) {
      return '<span style="flex:' + l.amount + ' 1 0;background:' + BAR_COLORS[i % BAR_COLORS.length] + ';transition-delay:' + (0.3 + i * 0.08) + 's"></span>';
    }).join('');
    $('#budget-legend').innerHTML = lines.map(function (l, i) {
      var pct = B.total ? Math.round(l.amount / B.total * 100) : 0;
      return '<li><span class="sw" style="background:' + BAR_COLORS[i % BAR_COLORS.length] + '"></span><span>' + esc(l.label) + '</span><span class="amt">' + money(l.amount) + '</span><span class="pct">' + pct + '%</span></li>';
    }).join('');
  }

  /* ---------------------------------------------------------- contact -- */
  var C = D.contact || {};
  var emailRaw = String(raw(C.email) || '').trim();
  var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);

  function linkRow(label, v, kind) {
    var val = String(raw(v) || '').trim();
    if (!val) return null;
    if (isPH(v) && kind !== 'mailto' && kind !== 'tel') return [label, show(v)];
    var href, text = esc(val);
    if (kind === 'mailto') href = emailValid ? 'mailto:' + val : null;
    else if (kind === 'tel') href = 'tel:' + val.replace(/[^\d+]/g, '');
    else if (/^https?:\/\//i.test(val)) { href = val; text = esc(val.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')); }
    if (!href) return [label, show(v)];
    var inner = isPH(v) ? '<span class="ph" title="Placeholder: replace in data.js">' + text + '</span>' : text;
    var ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return [label, '<a href="' + esc(href) + '"' + ext + '>' + inner + '</a>'];
  }

  function renderContact() {
    var who = show(C.name) + (raw(C.role) ? '<br><span class="not-set" style="font-style:normal">' + show(C.role) + '</span>' : '');
    $('#contact-list').innerHTML = dlRows([
      ['Contact', who],
      linkRow('Email', C.email, 'mailto'),
      linkRow('Telephone', C.phone, 'tel'),
      linkRow('Official ITF profile', C.itfProfile),
      linkRow('Website', C.website),
      linkRow('Instagram', C.instagram),
      linkRow('LinkedIn', C.linkedin)
    ].filter(Boolean));

    var season = esc(raw(S.season) || new Date().getFullYear());
    $('#copyright').innerHTML = '© ' + season + ' ' + esc(fullName.trim()) + '. Sponsorship portfolio, season ' + season + '.';

    renderQR();
  }

  /* QR code: drawn only when a real ITF profile URL is configured. The small
     generator library is loaded from cdnjs on demand. */
  function renderQR() {
    var card = $('#qr-card');
    var url = String(raw(C.itfProfile) || '').trim();
    if (!/^https?:\/\//i.test(url)) { card.hidden = true; return; }   // no profile link yet: no QR
    card.innerHTML = '<div class="qr-box" id="qr-box" role="img" aria-label="QR code linking to the official ITF profile"></div>' +
      '<p class="qr-copy"><strong>Official ITF profile</strong>Scan to open the player\'s profile.</p>';
    var draw = function () {
      try {
        var qr = window.qrcode(0, 'M');
        qr.addData(url); qr.make();
        $('#qr-box').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } catch (e) { $('#qr-box').textContent = 'QR'; }
    };
    if (window.qrcode) return draw();
    var s = doc.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.async = true;
    s.onload = draw;
    s.onerror = function () { $('#qr-box').classList.add('qr-box--empty'); $('#qr-box').textContent = 'QR'; };
    doc.head.appendChild(s);
  }

  /* ============================================================ REVEALS == */
  var boards = $$('.board');
  var N = boards.length;

  function animateCount(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (!isFinite(to)) return;
    var from = parseFloat(el.getAttribute('data-count-from'));
    if (!isFinite(from) || reduced()) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 1700;
    (function step(now) {
      var q = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(lerp(from, to, easeOut(q)));
      if (q < 1) requestAnimationFrame(step);
    })(t0);
  }

  function revealBoard(i) {
    var b = boards[i];
    if (!b || b.classList.contains('is-revealed')) return;
    b.classList.add('is-revealed');
    $$('[data-count]', b).forEach(animateCount);
    $$('.trend', b).forEach(function (p) { p.style.strokeDashoffset = 0; });
    $$('.achievement-list li', b).forEach(function (li, k) { li.style.setProperty('--i', k); });
  }

  /* ============================================================ CAMERA == */
  var world = $('#world');
  var stage = $('#stage');
  var track = $('#scroll-track');
  var court = $('#court');
  var hudEl = $('#hud'), reelEl = $('.reel');
  var DESKTOP_WORLD = { w: 8931, h: 4491 };
  var HOLD = 0.4;                 // share of each scroll segment where the camera rests on a shot
  var FOLLOW = 0.075;             // how quickly the camera catches up with the scroll position
  var CHAPTER_MS = 60000;         // every chapter plays for one minute, then the film moves on
  var TC_FPS = 25;

  var stations = boards.map(function (el, i) {
    return {
      el: el, i: i, id: el.id, title: el.getAttribute('data-title') || el.id,
      ax: +el.getAttribute('data-x') || 0, ay: +el.getAttribute('data-y') || 0, ar: +el.getAttribute('data-r') || 0,
      x: 0, y: 0, r: 0, w: 1440, h: 900, imgs: [], first: i
    };
  });

  /* Shots are the camera's resting points. On a desktop every frame is one shot.
     On a phone frames are laid out at reading size and a tall frame gets several
     shots, so the camera tilts down it the way a documentary pans across a page. */
  var shots = [], NS = 1;
  var WORLD = DESKTOP_WORLD;
  var compact = false;

  var canvas = root.classList.contains('is-canvas');
  var vw = 0, vh = 0, segH = 1, topH = 60, bottomH = 52;
  var P = 0;                      // displayed progress, in shots
  var ov = 0;                     // aerial-view blend 0..1
  var ovTween = null, flight = null;
  var active = -1;
  var raf = 0, lastNow = 0, idleTimer = 0;
  var programmatic = false, movingNow = false;
  var flightEls = [], ballEl, shadowEl;

  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    topH = hudEl ? hudEl.offsetHeight || 60 : 60;
    bottomH = reelEl && canvas ? reelEl.offsetHeight || 52 : 52;
  }
  function availH() { return vh - topH - bottomH - (compact ? 16 : 36); }
  function targetP() { return clamp(window.scrollY / segH, 0, NS - 1); }

  function fitScale(st) {
    var side = Math.max(20, vw * 0.02);
    return Math.min((vw - side * 2) / st.w, availH() / st.h);
  }
  function viewCenter() { return { x: vw / 2, y: (topH + vh - bottomH) / 2 }; }

  /* place the frames on the court and work out the shots */
  function layoutWorld() {
    compact = canvas && !root.classList.contains('is-fixed');
    stations.forEach(function (st) { st.imgs = $$('.media img', st.el); });
    if (!compact) {
      WORLD = DESKTOP_WORLD;
      stations.forEach(function (st) {
        st.el.style.width = '';
        st.w = 1440; st.h = 900; st.x = st.ax; st.y = st.ay; st.r = st.ar;
      });
    } else {
      /* frames at the width of the phone, two to a row, in a rally across the net */
      var BW = Math.round(vw - 24), M = 560, GX = 220, GY = 320, y = M;
      root.style.setProperty('--shot-h', Math.floor(availH()) + 'px');
      stations.forEach(function (st) {
        st.el.style.width = BW + 'px';
        st.el.style.transform = '';
        st.r = 0; st.w = BW;
      });
      stations.forEach(function (st) { st.h = st.el.offsetHeight; });
      for (var k = 0; k < N; k += 2) {
        var a = stations[k], b = stations[k + 1];
        if (b) { a.x = M + BW / 2; b.x = M + BW + GX + BW / 2; }
        else a.x = M + BW + GX / 2;
        a.y = y + a.h / 2;
        if (b) b.y = y + b.h / 2;
        y += Math.max(a.h, b ? b.h : 0) + GY;
      }
      WORLD = { w: 2 * M + 2 * BW + GX, h: y - GY + M };
    }
    stations.forEach(function (st) {
      st.el.style.left = (st.x - st.w / 2) + 'px';
      st.el.style.top = (st.y - st.h / 2) + 'px';
      st.el.style.transform = st.r ? 'rotate(' + st.r + 'deg)' : '';
    });
    world.style.width = court.style.width = WORLD.w + 'px';
    world.style.height = court.style.height = WORLD.h + 'px';

    shots = [];
    stations.forEach(function (st, k) {
      st.first = shots.length;
      if (!compact) { shots.push({ b: k, x: st.x, y: st.y, s: fitScale(st), r: st.r, n: 1, j: 0 }); return; }
      var sc = Math.min(1, (vw - 24) / st.w), avail = availH() / sc;
      var n = st.h <= avail + 8 ? 1 : Math.ceil((st.h - avail) / (avail * 0.7)) + 1;
      for (var j = 0; j < n; j++) {
        var cy = n === 1 ? st.y : (st.y - st.h / 2 + avail / 2) + (st.h - avail) * j / (n - 1);
        shots.push({ b: k, x: st.x, y: cy, s: sc, r: 0, n: n, j: j });
      }
    });
    NS = shots.length;
    segH = Math.round(vh * (compact ? 1.1 : 1.5));
    track.style.height = ((NS - 1) * segH + vh) + 'px';
    buildCourt();
  }

  function ctrlPoint(a, b, k) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 1;
    var off = len * 0.12 * (k % 2 ? -1 : 1);
    return { x: mx - dy / len * off, y: my + dx / len * off };
  }
  function bez(a, c, b, t) {
    var u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }

  /** Camera for a progress value: rest on a shot, then move to the next one.
      Between frames it glides along the ball's arc and pulls back a little,
      like a slow crane move; inside one frame it simply tilts down. */
  function camAt(p) {
    if (NS < 2) { var o = shots[0]; return { x: o.x, y: o.y, s: o.s, r: o.r, seg: 0, t: 0, e: 0, same: true }; }
    var i = Math.min(Math.floor(p), NS - 2);
    var t = clamp((p - i - HOLD / 2) / (1 - HOLD), 0, 1);
    var e = easeInOut(t);
    var a = shots[i], b = shots[i + 1], same = a.b === b.b;
    var pos = same ? { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) } : bez(a, ctrlPoint(a, b, i), b, e);
    var dist = Math.hypot(b.x - a.x, b.y - a.y);
    var depth = same ? 0.04 : compact ? 0.32 : clamp(dist / 9000 * 0.5, 0.1, 0.24);
    var s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) * (1 - depth * Math.sin(Math.PI * e));
    return { x: pos.x, y: pos.y, s: s, r: lerp(a.r, b.r, e), seg: i, t: t, e: e, same: same };
  }
  function overviewCam() {
    return { x: WORLD.w / 2, y: WORLD.h / 2, r: 0, s: Math.min(vw * 0.94 / WORLD.w, (vh - topH - bottomH - 40) * 0.94 / WORLD.h) };
  }
  function mixCam(a, b, k) {
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r, b.r, k), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), k)) };
  }

  function applyCam(c) {
    var vc = viewCenter();
    world.style.transform = 'translate(' + vc.x.toFixed(2) + 'px,' + vc.y.toFixed(2) + 'px) scale(' + c.s.toFixed(5) +
      ') rotate(' + (-c.r).toFixed(3) + 'deg) translate(' + (-c.x).toFixed(2) + 'px,' + (-c.y).toFixed(2) + 'px)';
  }

  function updateFlight(c) {
    flightEls.forEach(function (f) {
      if (!f) return;
      var frac = P >= NS - 1 ? 1 : f.k < c.seg ? 1 : f.k === c.seg ? c.e : 0;
      f.el.style.strokeDashoffset = (f.len * (1 - frac)).toFixed(1);
    });
    var flying = c.t > 0 && c.t < 1 && !c.same;
    if (!ballEl) return;
    if (!flying) { ballEl.style.opacity = 0; shadowEl.style.opacity = 0; return; }
    var a = shots[c.seg], b = shots[c.seg + 1];
    var pos = bez(a, ctrlPoint(a, b, c.seg), b, c.e);
    var lift = Math.sin(Math.PI * c.e), k = compact ? 0.45 : 1;
    var fade = clamp(lift * 3, 0, 1);
    ballEl.setAttribute('transform', 'translate(' + pos.x.toFixed(1) + ' ' + pos.y.toFixed(1) + ') scale(' + (k * (1 + lift * 0.7)).toFixed(3) + ')');
    shadowEl.setAttribute('transform', 'translate(' + (pos.x + lift * 110 * k).toFixed(1) + ' ' + (pos.y + lift * 150 * k).toFixed(1) + ') scale(' + k + ')');
    ballEl.style.opacity = fade; shadowEl.style.opacity = fade * 0.8;
  }

  function parallax(c) {
    stations.forEach(function (st) {
      if (!st.imgs.length) return;
      var dx = c.x - st.x, dy = c.y - st.y;
      if (Math.abs(dx) > 3200 || Math.abs(dy) > 2600) return;
      var rad = -st.r * Math.PI / 180, k = compact ? 0.02 : 0.03;
      var lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      var px = clamp(-lx * k, -42, 42).toFixed(1) + 'px', py = clamp(-ly * k, -30, 30).toFixed(1) + 'px';
      st.imgs.forEach(function (img) { img.style.setProperty('--px', px); img.style.setProperty('--py', py); });
    });
  }

  /* Frames fade with the camera's distance from them, every frame, so light
     moves continuously instead of switching when the active frame changes. */
  function lightFrames(cam) {
    stations.forEach(function (st) {
      var d = compact
        ? Math.hypot(Math.max(0, Math.abs(cam.x - st.x) - st.w / 2), Math.max(0, Math.abs(cam.y - st.y) - st.h / 2)) / 240
        : Math.max(0, Math.hypot(cam.x - st.x, cam.y - st.y) - 160) / 1900;
      var near = 1 - clamp(d, 0, 1);
      near = near * near * (3 - 2 * near);
      var o = lerp(lerp(0.2, 1, near), 1, ov);
      if (Math.abs((st.o || 0) - o) > 0.002) { st.o = o; st.el.style.opacity = o.toFixed(3); }
    });
  }

  /* ---------------------------------------------------- playhead & autoplay -- */
  /* The film runs on its own: each chapter holds for a minute (split across its
     shots on a phone), then the camera moves on. Scrolling or the keys take over
     at any time; the film carries on from wherever the reader stops. */
  var clock = null, autoTimer = 0;
  function shotStart(i) { var sh = shots[clamp(i, 0, NS - 1)]; return (sh.b + sh.j / sh.n) * CHAPTER_MS; }
  function shotEnd(i) { var sh = shots[clamp(i, 0, NS - 1)]; return (sh.b + (sh.j + 1) / sh.n) * CHAPTER_MS; }
  function timeAtP(p) {
    var i = Math.min(Math.floor(p), NS - 1);
    return i >= NS - 1 ? shotStart(NS - 1) : lerp(shotStart(i), shotStart(i + 1), p - i);
  }
  function playhead() {
    if (clock && (!movingNow || (flight && flight.auto))) {
      return Math.min(clock.base + (clock.paused ? 0 : performance.now() - clock.t0), N * CHAPTER_MS);
    }
    return timeAtP(P);
  }
  function autoDur(i) { return shots[i].b === shots[i + 1].b ? 2400 : 2800; }
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!canvas || !clock || clock.paused || clock.shot >= NS - 1) return;
    var from = clock.shot, dur = autoDur(from);
    var wait = shotEnd(from) - playhead() - dur;
    autoTimer = setTimeout(function () {
      if (canvas && clock && clock.shot === from && !flight && !doc.hidden) goTo(from + 1, { auto: true, dur: dur });
    }, Math.max(0, wait));
  }
  /* called whenever the camera comes to rest */
  function onRest() {
    if (!canvas || root.classList.contains('is-intro')) return;
    var i = clamp(Math.round(P), 0, NS - 1);
    if (clock && clock.shot === i) return;
    clock = { base: shotStart(i), t0: performance.now(), shot: i, paused: false };
    scheduleAuto();
  }

  function timecode(ms) {
    var f = Math.floor(ms / 1000 * TC_FPS);
    var ff = f % TC_FPS, sec = Math.floor(f / TC_FPS);
    return [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60, ff].map(pad2).join(':');
  }
  /* timecode and chapter strip follow the playhead */
  function tick() {
    if (!canvas) return;
    var ph = playhead();
    var tc = timecode(ph);
    if (tcEl.textContent !== tc) tcEl.textContent = tc;
    reelFills.forEach(function (el, k) {
      var tr = 'scaleX(' + clamp((ph - k * CHAPTER_MS) / CHAPTER_MS, 0, 1).toFixed(3) + ')';
      if (el.style.transform !== tr) el.style.transform = tr;
    });
  }

  function render() {
    var c = camAt(P);
    var cam = ov > 0.0001 ? mixCam(c, overviewCam(), ov) : c;
    applyCam(cam);
    updateFlight(c);
    parallax(cam);
    lightFrames(cam);
    /* a gentle dip toward black in the middle of each move between frames */
    var travel = c.t > 0 && c.t < 1 && !c.same ? Math.sin(Math.PI * c.e) : 0;
    var dip = (travel * 0.32 * (1 - ov)).toFixed(3);
    if (dipEl.style.opacity !== dip) dipEl.style.opacity = dip;
    var idx = c.t < 0.5 ? c.seg : Math.min(NS - 1, c.seg + 1);
    var b = shots[idx].b;
    setActive(b);
    if (!root.classList.contains('is-intro') && ov < 0.5 && (c.t < 0.4 || c.t > 0.6)) revealBoard(b);
    setProgress(NS > 1 ? P / (NS - 1) : 1);
    tick();
  }

  function frame(now) {
    raf = 0;
    var dt = lastNow ? Math.min(64, now - lastNow) : 16.7;
    lastNow = now;

    if (flight) {
      var q = clamp((now - flight.start) / flight.dur, 0, 1);
      P = lerp(flight.from, flight.to, easeInOut(q));
      programmatic = true;
      window.scrollTo(0, Math.round(P * segH));
      if (q >= 1) { flight = null; P = targetP(); }
    } else {
      var T = targetP();
      P += (T - P) * (1 - Math.pow(1 - FOLLOW, dt / 16.7));
      if (Math.abs(T - P) < 0.0004) P = T;
    }
    if (ovTween) {
      var k = clamp((now - ovTween.start) / ovTween.dur, 0, 1);
      ov = lerp(ovTween.from, ovTween.to, easeInOut(k));
      if (k >= 1) { var cb = ovTween.done; ovTween = null; if (cb) cb(); }
    }

    movingNow = !!(flight || ovTween || P !== targetP());
    render();

    if (movingNow) {
      world.classList.add('is-moving');
      clearTimeout(idleTimer);
      raf = requestAnimationFrame(frame);
    } else {
      lastNow = 0;
      programmatic = false;
      clearTimeout(idleTimer);
      /* drop will-change at rest so text re-rasterises crisply at the final scale */
      idleTimer = setTimeout(function () { world.classList.remove('is-moving'); }, 160);
      onRest();
    }
  }
  function kick() { if (canvas && !raf) raf = requestAnimationFrame(frame); }

  function tweenOverview(to, dur, done) {
    ovTween = { from: ov, to: to, start: performance.now(), dur: dur, done: done };
    kick();
  }

  /* --------------------------------------------------------- the court -- */
  /* Drawn in desktop court units (1 m = 300 px). On a phone the same court is
     turned upright and scaled to run the length of the column of frames. */
  function buildCourt() {
    var W = DESKTOP_WORLD.w, H = DESKTOP_WORLD.h;
    var X0 = 900, Y0 = 600, L = 7131, CW = 3291;     // doubles court, 23.77 × 10.97 m
    var net = X0 + L / 2, alley = 411, svc = 1920, cy = Y0 + CW / 2;
    var ln = function (x1, y1, x2, y2, cls) { return '<line class="line ' + (cls || '') + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'; };
    var brand = 'YOUR BRAND HERE';
    var kc = WORLD.h / W;
    var groupT = compact ? ' transform="translate(' + ((WORLD.w + H * kc) / 2).toFixed(1) + ' 0) rotate(90) scale(' + kc.toFixed(5) + ')"' : '';
    var html = [
      '<rect class="runoff" x="' + (-WORLD.w) + '" y="' + (-WORLD.h) + '" width="' + (WORLD.w * 3) + '" height="' + (WORLD.h * 3) + '"/>',
      /* koshkar-muiz ornament, woven round the court like the border of a syrmak rug */
      '<defs><pattern id="orn" patternUnits="userSpaceOnUse" width="320" height="160"><g class="orn-path" transform="scale(5)">' +
        '<path d="M32 30C32 18 22 10 13 13C6 15.5 7 25 14 24C18.5 23.4 18.5 18 14.5 18.5"/>' +
        '<path d="M32 30C32 18 42 10 51 13C58 15.5 57 25 50 24C45.5 23.4 45.5 18 49.5 18.5"/></g></pattern></defs>',
      '<g' + groupT + '>',
      '<rect class="ornament-field" x="' + (X0 - 260) + '" y="' + (Y0 - 260) + '" width="' + (L + 520) + '" height="' + (CW + 520) + '"/>',
      '<rect class="surface" x="' + X0 + '" y="' + Y0 + '" width="' + L + '" height="' + CW + '"/>',
      '<text class="paint" font-size="270" text-anchor="middle" dominant-baseline="middle" transform="translate(470 ' + cy + ') rotate(-90)">' + brand + '</text>',
      '<text class="paint" font-size="270" text-anchor="middle" dominant-baseline="middle" transform="translate(' + (W - 470) + ' ' + cy + ') rotate(90)">' + brand + '</text>',
      ln(X0, Y0, X0 + L, Y0), ln(X0, Y0 + CW, X0 + L, Y0 + CW),
      ln(X0, Y0 + alley, X0 + L, Y0 + alley), ln(X0, Y0 + CW - alley, X0 + L, Y0 + CW - alley),
      ln(X0, Y0, X0, Y0 + CW, 'line--base'), ln(X0 + L, Y0, X0 + L, Y0 + CW, 'line--base'),
      ln(net - svc, Y0 + alley, net - svc, Y0 + CW - alley), ln(net + svc, Y0 + alley, net + svc, Y0 + CW - alley),
      ln(net - svc, cy, net + svc, cy),
      ln(X0, cy, X0 + 45, cy), ln(X0 + L - 45, cy, X0 + L, cy),
      '<line class="net-band" x1="' + net + '" y1="' + (Y0 - 274) + '" x2="' + net + '" y2="' + (Y0 + CW + 274) + '"/>',
      '<line class="net" x1="' + (net + 14) + '" y1="' + (Y0 - 274) + '" x2="' + (net + 14) + '" y2="' + (Y0 + CW + 274) + '"/>',
      '<circle class="post" cx="' + net + '" cy="' + (Y0 - 274) + '" r="26"/>',
      '<circle class="post" cx="' + net + '" cy="' + (Y0 + CW + 274) + '" r="26"/>',
      '</g>',
      '<g id="flights"></g>',
      '<ellipse class="ball-shadow" id="ball-shadow" rx="40" ry="26" style="opacity:0"/>',
      '<g id="ball" style="opacity:0"><circle class="ball" r="38"/><path class="ball-seam" d="M-27 -26 C -6 -10, -6 10, -27 26 M27 -26 C 6 -10, 6 10, 27 26"/></g>'
    ];
    court.setAttribute('viewBox', '0 0 ' + WORLD.w + ' ' + WORLD.h);
    court.innerHTML = html.join('');

    /* the ball's path between frames, drawn as the film plays */
    var g = $('#flights', court);
    flightEls = [];
    for (var k = 0; k < NS - 1; k++) {
      var a = shots[k], b = shots[k + 1];
      if (a.b === b.b) { flightEls.push(null); continue; }
      var c = ctrlPoint(a, b, k), len = 0, prev = a;
      for (var s = 1; s <= 48; s++) { var pt = bez(a, c, b, s / 48); len += Math.hypot(pt.x - prev.x, pt.y - prev.y); prev = pt; }
      var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'flight');
      path.setAttribute('d', 'M' + a.x + ' ' + a.y + ' Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + b.x + ' ' + b.y);
      path.style.strokeDasharray = len.toFixed(1);
      path.style.strokeDashoffset = len.toFixed(1);
      g.appendChild(path);
      flightEls.push({ el: path, len: len, k: k });
    }
    ballEl = $('#ball', court);
    shadowEl = $('#ball-shadow', court);
  }

  function clearLayout() {
    stations.forEach(function (st) {
      st.el.style.left = st.el.style.top = st.el.style.transform = st.el.style.opacity = st.el.style.width = '';
      st.o = null;
      st.imgs.forEach(function (img) { img.style.removeProperty('--px'); img.style.removeProperty('--py'); });
    });
    world.style.transform = world.style.width = world.style.height = '';
    track.style.height = '';
  }

  /* ======================================================== NAVIGATION == */
  var hudNum = $('#hud-num'), hudOf = $('#hud-of'), hudTitle = $('#hud-title'), hudProg = $('#hud-progress');
  var tcEl = $('#tc'), dipEl = $('#film-dip');
  var reelTicks = [], reelFills = [];
  var flatActive = 0;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function setActive(i) {
    if (i === active) return;
    active = i;
    boards.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
    hudNum.textContent = i + 1;
    hudOf.textContent = N;
    hudTitle.textContent = stations[i].title;
    reelTicks.forEach(function (t, k) { t.classList.toggle('is-current', k === i); });
    if (!root.classList.contains('is-intro') && history.replaceState) {
      try { history.replaceState(null, '', '#' + stations[i].id); } catch (e) {}
    }
  }
  function setProgress(f) { hudProg.style.transform = 'scaleX(' + clamp(f, 0, 1).toFixed(4) + ')'; }
  /* current position: a shot in canvas mode, a frame in page mode */
  function current() { return canvas ? clamp(Math.round(targetP()), 0, NS - 1) : flatActive; }
  function startOf(board) { return canvas ? stations[board].first : board; }

  /** Move to a shot (canvas) or frame (page). */
  function goTo(i, opts) {
    opts = opts || {};
    if (!canvas) {
      i = clamp(i | 0, 0, N - 1);
      boards[i].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    i = clamp(i | 0, 0, NS - 1);
    if (!opts.auto) clearTimeout(autoTimer);
    var from = P, dist = Math.abs(i - from);
    if (dist < 0.001) return;
    var span = Math.abs(shots[i].b - shots[clamp(Math.round(from), 0, NS - 1)].b);
    var dur = opts.dur || (opts.settle ? 900 + 1400 * dist : span <= 1 ? 2300 : 3400);
    flight = { from: from, to: i, start: performance.now(), dur: dur, auto: !!opts.auto };
    if (span > 1) {
      /* long jumps rise toward the aerial view mid-flight so the route stays readable */
      tweenOverview(0.6, dur * 0.5, function () { tweenOverview(0, dur * 0.5); });
    }
    kick();
  }

  /* When scrolling stops between two shots, glide on to the nearer one
     (biased toward the direction the reader was scrolling). */
  var settleTimer = 0, lastY = 0, scrollDir = 0;
  function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 240);
  }
  function settle() {
    if (!canvas || flight || ovTween || root.classList.contains('is-intro')) return;
    var T = targetP(), i = Math.floor(T), f = T - i, rest = HOLD / 2;
    if (i >= NS - 1 || f <= rest || f >= 1 - rest) return;     // already resting on a shot
    var mid = 0.5 + (scrollDir > 0 ? -0.22 : scrollDir < 0 ? 0.22 : 0);
    goTo(f > mid ? i + 1 : i, { settle: true });
  }

  function cancelFlight() {
    if (!flight) return;
    flight = null;
    if (ovTween && ovTween.to > 0) tweenOverview(0, 900);
  }

  /* the chapter strip in the bottom bar: a display, not a control */
  function renderReel() {
    var host = $('#reel-ticks');
    if (!host) return;
    host.innerHTML = stations.map(function (st, i) {
      return '<li class="reel-tick"><span class="reel-n">' + (i + 1) + '</span><span class="reel-bar"><i></i></span></li>';
    }).join('');
    reelTicks = $$('.reel-tick', host);
    reelFills = $$('.reel-bar i', host);
  }

  /* ============================================================ MODES == */
  var revealIO = null, spyIO = null;
  var viewPref = /[?&]view=page/.test(location.search) ? 'page' : null;

  /* the film plays everywhere except with reduced motion or ?view=page */
  function canvasPossible() { return !reduced() && viewPref !== 'page'; }
  function wantFixed() { return window.innerWidth >= 960 && window.innerHeight >= 560; }

  function setupObservers() {
    if (!('IntersectionObserver' in window)) { boards.forEach(function (b, i) { revealBoard(i); }); return; }
    revealIO = new IntersectionObserver(function (entries) {
      if (canvas) return;
      entries.forEach(function (en) {
        if (en.isIntersecting) { revealBoard(boards.indexOf(en.target)); revealIO.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    spyIO = new IntersectionObserver(function (entries) {
      if (canvas) return;
      entries.forEach(function (en) {
        if (en.isIntersecting) { flatActive = boards.indexOf(en.target); setActive(flatActive); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    boards.forEach(function (b) { if (!b.classList.contains('is-revealed')) revealIO.observe(b); spyIO.observe(b); });
  }

  function onFlatScroll() {
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    setProgress(max > 0 ? window.scrollY / max : 0);
  }

  /* put the camera on a frame and start its minute */
  function placeOn(board) {
    var idx = stations[clamp(board, 0, N - 1)].first;
    programmatic = true;
    window.scrollTo(0, idx * segH);
    P = idx;
  }

  function setMode(on, first) {
    var board = first ? hashIndex() : Math.max(0, active);
    canvas = on;
    root.classList.toggle('is-canvas', on);
    root.classList.toggle('is-fixed', on && wantFixed());
    flight = null; ovTween = null; clock = null; clearTimeout(autoTimer);

    if (on) {
      measure();
      layoutWorld();
      placeOn(board);
      active = -1;
      if (first) {
        ov = 1;
        render();
        /* opening title on black, then it fades and the camera descends from the aerial view */
        var start = function () {
          root.classList.add('is-rolling');
          setTimeout(function () {
            tweenOverview(0, 3200, function () {
              root.classList.remove('is-intro', 'is-rolling');
              revealBoard(active);
            });
          }, 600);
        };
        var fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
        Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {
          /* fonts change the height of frames on a phone, so measure again before the film starts */
          if (compact) { measure(); layoutWorld(); placeOn(board); render(); }
          setTimeout(start, 1900);
        });
      } else {
        root.classList.remove('is-intro');
        ov = 0;
        render();
        revealBoard(board);
        onRest();
      }
    } else {
      root.classList.remove('is-intro');
      clearLayout();
      if (!first || board > 0) boards[board].scrollIntoView({ block: 'start' });
      setActive(board);
      onFlatScroll();
    }
  }

  function evaluateMode() {
    var want = canvasPossible();
    if (want !== canvas) { setMode(want); return true; }
    return false;
  }

  function hashIndex() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    var k = stations.findIndex(function (s) { return s.id === id; });
    return k < 0 ? 0 : k;
  }

  /* ============================================================ EVENTS == */
  function bindEvents() {
    window.addEventListener('scroll', function () {
      if (canvas) {
        var y = window.scrollY;
        if (y !== lastY) { scrollDir = y > lastY ? 1 : -1; lastY = y; }
        if (!flight && !programmatic) { clearTimeout(autoTimer); scheduleSettle(); }
        if (!flight) kick();
      } else {
        onFlatScroll();
      }
    }, { passive: true });

    /* user input during an automated flight hands control back to the user */
    ['wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function () { programmatic = false; cancelFlight(); }, { passive: true });
    });

    var resizeRaf = 0, lastW = window.innerWidth, lastH = window.innerHeight;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(function () {
        if (evaluateMode() || !canvas) { lastW = window.innerWidth; lastH = window.innerHeight; return; }
        var w = window.innerWidth, h = window.innerHeight;
        var fixedNow = wantFixed();
        /* a phone's toolbar sliding away only nudges the framing; real size changes re-lay the court */
        var relayout = fixedNow !== root.classList.contains('is-fixed') || w !== lastW || (compact ? Math.abs(h - lastH) > 140 : h !== lastH);
        measure();
        if (relayout) {
          lastW = w; lastH = h;
          root.classList.toggle('is-fixed', fixedNow);
          var b = Math.max(0, active), keep = P;
          measure();
          layoutWorld();
          if (compact) { placeOn(b); clock = null; }
          else { P = clamp(keep, 0, NS - 1); programmatic = true; window.scrollTo(0, Math.round(P * segH)); }
        }
        render();
        if (clock) scheduleAuto(); else onRest();
      });
    });
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', function () { evaluateMode(); });

    /* the film pauses while the tab is hidden and carries on when it comes back */
    doc.addEventListener('visibilitychange', function () {
      if (!clock) return;
      if (doc.hidden) { clock.base = playhead(); clock.paused = true; clearTimeout(autoTimer); }
      else { clock.t0 = performance.now(); clock.paused = false; scheduleAuto(); }
    });

    /* timecode and chapter strip keep running while the camera rests */
    setInterval(tick, 80);

    /* the fixed stage must never scroll itself (focus or find-in-page can try) */
    stage.addEventListener('scroll', function () { if (canvas) { stage.scrollTop = 0; stage.scrollLeft = 0; } });

    /* keyboard focus moving into another frame (e.g. tabbing to a contact link) flies the camera there */
    doc.addEventListener('focusin', function (e) {
      if (!canvas || flight) return;
      var b = e.target.closest && e.target.closest('.board');
      if (!b) return;
      var k = boards.indexOf(b);
      if (k !== active) goTo(startOf(k));
    });

    /* clicking a dimmed neighbouring frame flies to it */
    boards.forEach(function (b, k) {
      b.addEventListener('click', function (e) {
        if (!canvas || k === active) return;
        e.preventDefault(); e.stopPropagation(); goTo(startOf(k));
      }, true);
    });

    /* arrow keys, Page Up/Down, Space, Home and End step through the shots */
    doc.addEventListener('keydown', function (e) {
      if (!canvas || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target;
      if (e.key === ' ' && t.closest && t.closest('a')) return;
      var from = flight ? flight.to : current();
      var next = ['ArrowRight', 'ArrowDown', 'PageDown', ' '], prev = ['ArrowLeft', 'ArrowUp', 'PageUp'];
      if (next.indexOf(e.key) > -1) { e.preventDefault(); goTo(Math.min(NS - 1, from + 1)); }
      else if (prev.indexOf(e.key) > -1) { e.preventDefault(); goTo(Math.max(0, from - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(NS - 1); }
    });

    window.addEventListener('hashchange', function () {
      var k = hashIndex();
      if (k !== active) goTo(startOf(k));
    });

    /* print / save as PDF (Cmd or Ctrl + P): fixed 1440×900 frames, everything revealed */
    var toPrint = function () {
      root.classList.add('is-fixed');
      boards.forEach(function (b, i) { revealBoard(i); });
      $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    };
    window.addEventListener('beforeprint', toPrint);
    var printMQ = window.matchMedia('print');
    if (printMQ.addEventListener) printMQ.addEventListener('change', function (e) { if (e.matches) toPrint(); });
    window.addEventListener('afterprint', function () { if (!canvas || compact) root.classList.toggle('is-fixed', canvas && wantFixed()); });

    /* once the page has loaded, fetch the remaining photos so print and fast flights have them */
    window.addEventListener('load', function () {
      setTimeout(function () { $$('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; }); }, 2500);
    });
  }

  /* ============================================================== INIT == */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}

  renderBindings();
  renderImages();
  renderProfile();
  renderRankings();
  renderResults();
  renderGoals();
  renderFunding();
  renderContact();
  renderReel();
  setupObservers();
  bindEvents();

  setMode(canvasPossible(), true);
})();
