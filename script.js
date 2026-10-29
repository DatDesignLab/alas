/* ALAS homepage prototype: small, dependency-free behaviours.
   Everything decorative respects prefers-reduced-motion. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- Header: shadow on scroll + mobile menu ---------- */
  var header = document.querySelector('[data-header]');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');

  function onScrollHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  navToggle.addEventListener('click', function () {
    var open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      navToggle.focus();
    }
  });

  /* ---------- Papel picado strand across the hero ---------- */
  var papelHosts = Array.prototype.slice.call(document.querySelectorAll('[data-papel]'));
  var PAPEL_COLOURS = ['#C84869', '#FFD500', '#44B7B4', '#FF561C', '#B7AED1', '#E52571', '#F3AB3D', '#A7E0DE'];
  // Flag 60 x 74 with a zig-zag hem; holes cut with even-odd fill (a heart or a flower in the middle).
  var FLAG_OUTLINE = 'M0 0H60V64L55 70L50 64L45 70L40 64L35 70L30 64L25 70L20 64L15 70L10 64L5 70L0 64Z';
  var FLAG_EDGE = 'M8 9h44v2H8zM9 12l3 3-3 3-3-3zM51 12l3 3-3 3-3-3zM9 50l3 3-3 3-3-3zM51 50l3 3-3 3-3-3zM14 57h32v2H14z';
  var HOLE_HEART = 'M30 47C19 40 17 33 17 29C17 24 21 21 24.5 21C27 21 29 22.5 30 25C31 22.5 33 21 35.5 21C39 21 43 24 43 29C43 33 41 40 30 47Z';
  var HOLE_FLOWER = 'M30 21c3 0 4 4 2 7 3-2 7-1 7 2s-4 4-7 2c2 3 1 7-2 7s-4-4-2-7c-3 2-7 1-7-2s4-4 7-2c-2-3-1-7 2-7zM30 28.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3z';

  function buildPapel() { papelHosts.forEach(buildStrand); }

  function buildStrand(papelHost) {
    var w = papelHost.clientWidth;
    var small = w < 700;
    var colours = papelHost.hasAttribute('data-papel-colours') ? papelHost.getAttribute('data-papel-colours').split(',') : PAPEL_COLOURS;
    var scale = small ? 0.72 : 1;
    var flagW = 60 * scale;
    var gap = small ? 12 : 22;
    var count = Math.max(4, Math.floor((w + gap) / (flagW + gap)));
    var used = count * flagW + (count - 1) * gap;
    var startX = (w - used) / 2;
    var y0 = small ? 6 : 10;
    var sag = small ? 22 : 38;

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', papelHost.clientHeight);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + papelHost.clientHeight);

    var string = document.createElementNS(SVG_NS, 'path');
    string.setAttribute('d', 'M-10 ' + y0 + ' Q' + w / 2 + ' ' + (y0 + 2 * sag) + ' ' + (w + 10) + ' ' + y0);
    string.setAttribute('fill', 'none');
    string.setAttribute('stroke', 'rgba(255,255,255,.85)');
    string.setAttribute('stroke-width', '1.5');
    svg.appendChild(string);

    for (var i = 0; i < count; i++) {
      var x = startX + i * (flagW + gap);
      var t = (x + flagW / 2 + 10) / (w + 20);
      var y = y0 + 4 * sag * t * (1 - t) - 2;
      var outer = document.createElementNS(SVG_NS, 'g');
      outer.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + scale + ')');
      var flag = document.createElementNS(SVG_NS, 'g');
      flag.setAttribute('class', 'papel__flag');
      flag.style.setProperty('--d', (4 + (i * 1.37) % 3).toFixed(2) + 's');
      flag.style.setProperty('--delay', (-(i * 0.83) % 4).toFixed(2) + 's');
      flag.style.setProperty('--amp', (2.2 + (i % 3) * 0.8).toFixed(1) + 'deg');
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', FLAG_OUTLINE + FLAG_EDGE + (i % 2 ? HOLE_FLOWER : HOLE_HEART));
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('fill', colours[i % colours.length]);
      path.setAttribute('opacity', '.95');
      flag.appendChild(path);
      outer.appendChild(flag);
      svg.appendChild(outer);
    }
    papelHost.replaceChildren(svg);
  }

  /* ---------- Interactive model (ARIA tabs: click, hover, arrow keys) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.model__step'));
  var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function selectStep(index, moveFocus) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      if (on && tab.getAttribute('aria-selected') === 'true' && !panels[i].hidden) return;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on) {
        panels[i].classList.remove('is-entering');
        void panels[i].offsetWidth;
        panels[i].classList.add('is-entering');
      }
    });
    if (moveFocus) tabs[index].focus();
  }

  if (tabs.length) {
    selectStep(0, false);
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectStep(i, false); });
      tab.addEventListener('mouseenter', function () { if (finePointer.matches) selectStep(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); selectStep(next, true); }
      });
    });
  }

  /* ---------- Sliders: arrow buttons step one card at a time ---------- */
  document.querySelectorAll('[data-slider-nav]').forEach(function (nav) {
    var track = document.getElementById(nav.getAttribute('data-slider-nav'));
    if (!track) return;
    var prev = nav.querySelector('[data-dir="-1"]');
    var next = nav.querySelector('[data-dir="1"]');
    function step() {
      var first = track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first ? first.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function updateButtons() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dir]');
      if (!btn) return;
      track.scrollBy({ left: Number(btn.getAttribute('data-dir')) * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(updateButtons); }, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  });

  /* ---------- Program cards: flip on hover (mouse); tap flips on touch; keyboard focus flips ----------
     The card (li) is the only hit target: its rotating faces ignore the pointer (CSS), so a card
     mid-flip can never steal the hover from, or hand it to, the card next to or below it. */
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.pcard:not(.pcard--all)'));
  function closeCards(except) {
    cards.forEach(function (c) { if (c !== except) c.classList.remove('is-flipped'); });
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;          // the Explore button just works
      if (hoverCapable.matches) return;                   // a mouse flips by hovering
      card.classList.toggle('is-flipped');               // each card flips on its own; others stay as they are
    });
    card.addEventListener('keydown', function (e) { if (e.key === 'Escape') card.classList.remove('is-flipped'); });
  });
  // touch: tapping anywhere else turns open cards back over
  document.addEventListener('click', function (e) {
    if (hoverCapable.matches) return;
    if (e.target.closest('.pcard')) return;
    closeCards(null);
  });

  /* ---------- Video slide: load the player only when someone presses play ----------
     Set data-youtube="VIDEO_ID" (embedded privately, no outside link) or data-src="video.mp4". */
  document.querySelectorAll('.video').forEach(function (box) {
    var play = box.querySelector('.video__play');
    play.addEventListener('click', function () {
      var yt = box.getAttribute('data-youtube');
      var src = box.getAttribute('data-src');
      var player;
      if (yt) {
        player = document.createElement('iframe');
        player.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(yt) + '?autoplay=1&rel=0&modestbranding=1';
        player.allow = 'autoplay; encrypted-media; picture-in-picture';
        player.allowFullscreen = true;
        player.title = play.getAttribute('aria-label');
        player.referrerPolicy = 'strict-origin-when-cross-origin';
      } else if (src) {
        player = document.createElement('video');
        player.src = src; player.controls = true; player.autoplay = true; player.playsInline = true;
      } else {
        play.setAttribute('aria-label', 'Video coming soon');
        play.classList.add('is-waiting');
        return;
      }
      box.appendChild(player);
      box.closest('.hslide').classList.add('is-playing');
      if (player.focus) player.focus();
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var milagroBig = document.querySelector('.milagro[data-milagro]');
  function openMilagro() { if (milagroBig) milagroBig.classList.add('is-open'); }

  var revealTargets = document.querySelectorAll('.reveal, .milagro[data-milagro]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target === milagroBig) {
          // when the colibrí is flying, the heart opens as it lands instead
          if (!flightEnabled()) { openMilagro(); io.unobserve(entry.target); }
          return;
        }
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
    openMilagro();
  }

  /* ---------- Photo bands: gentle parallax ---------- */
  var bandImgs = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  function updateParallax() {
    if (reduceMotion.matches) return;
    var vh = window.innerHeight;
    bandImgs.forEach(function (img) {
      var r = img.parentNode.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      img.style.transform = 'translate3d(0,' + (-progress * r.height * 0.08).toFixed(1) + 'px,0)';
    });
  }

  /* ---------- The colibrí's journey ----------
     Step 6 of the model says we "pollinate other communities". The colibrí takes off from
     that step, flies down the page with the reader, pollinates the programs and the impact
     (flowers bloom where it passes) and lands on the milagro at Join, which opens its wings:
     the model has reached you, the next community. Static (already landed) on small screens
     and when motion is reduced. */
  var journey = document.querySelector('[data-colibri-journey]');
  var trailSvg = journey && journey.querySelector('[data-trail]');
  var bird = journey && journey.querySelector('[data-bird]');
  var flight = null;   // geometry, rebuilt on resize

  function flightEnabled() {
    return !reduceMotion.matches && window.innerWidth >= 1100;
  }

  function pageRect(el) {
    var r = el.getBoundingClientRect();
    return { l: r.left + window.scrollX, t: r.top + window.scrollY, r: r.right + window.scrollX, b: r.bottom + window.scrollY, w: r.width, h: r.height };
  }

  // Catmull-Rom through the points, as cubic Béziers
  function smoothPath(p) {
    var d = 'M' + p[0].x.toFixed(1) + ' ' + p[0].y.toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      // keep each curve between its own end points sideways, so it never bulges off the page
      var minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      c1x = Math.min(maxX, Math.max(minX, c1x));
      c2x = Math.min(maxX, Math.max(minX, c2x));
      d += ' C' + [c1x, c1y, c2x, c2y, p2.x, p2.y].map(function (n) { return n.toFixed(1); }).join(' ');
    }
    return d;
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function makeBloom(x, y, petal, heart) {
    var g = svgEl('g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' });
    var inner = svgEl('g', { 'class': 'bloom' });
    for (var a = 0; a < 5; a++) {
      inner.appendChild(svgEl('ellipse', { cx: 0, cy: -9, rx: 5.5, ry: 9, fill: petal, transform: 'rotate(' + (a * 72) + ')' }));
    }
    inner.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 4.5, fill: heart }));
    g.appendChild(inner);
    return { g: g, inner: inner };
  }

  function buildJourney() {
    if (!journey) return;
    var step6 = document.getElementById('step-tab-6');
    var programs = document.getElementById('programs');
    var impact = document.getElementById('impact');
    var bands = document.querySelectorAll('.photo-band');
    var container = programs.querySelector('.container');
    if (!step6 || !milagroBig || !container || bands.length < 3) return;

    var docW = document.documentElement.clientWidth;
    var cs = getComputedStyle(container);
    var c = pageRect(container);
    var innerL = c.l + parseFloat(cs.paddingLeft);
    var innerR = c.r - parseFloat(cs.paddingRight);
    var gutterR = Math.min((innerR + docW) / 2, docW - 44);   // keep the bird on the page
    var gutterL = Math.max(innerL / 2, 44);

    var s6 = pageRect(step6), pr = pageRect(programs), b3 = pageRect(bands[2]), im = pageRect(impact), mil = pageRect(milagroBig);
    var points = [
      { x: s6.l + s6.w * 0.8, y: s6.t + s6.h * 0.25 },      // the hummingbird in step 6
      { x: gutterR, y: pr.t + 160 },
      { x: gutterR, y: pr.b - 80 },
      { x: gutterL, y: b3.b - 60 },                          // crosses the photo band
      { x: gutterL, y: im.b - 140 },
      { x: mil.r + 34, y: mil.t + 6 }                        // lands on the milagro
    ];

    trailSvg.replaceChildren();
    var height = points[points.length - 1].y + 120;
    trailSvg.setAttribute('width', docW);
    trailSvg.setAttribute('height', height);
    trailSvg.setAttribute('viewBox', '0 0 ' + docW + ' ' + height);

    var d = smoothPath(points);
    var defs = svgEl('defs', {});
    var mask = svgEl('mask', { id: 'trail-reveal', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: docW, height: height });
    var reveal = svgEl('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 14 });
    mask.appendChild(reveal);
    defs.appendChild(mask);
    trailSvg.appendChild(defs);
    var trail = svgEl('path', { d: d, 'class': 'trail', mask: 'url(#trail-reveal)' });
    trailSvg.appendChild(trail);

    var total = trail.getTotalLength();
    reveal.setAttribute('stroke-dasharray', total + ' ' + total);
    reveal.setAttribute('stroke-dashoffset', total);

    // samples so a page height can be turned into a distance along the path
    var samples = [], maxY = -Infinity, N = 500;
    for (var i = 0; i <= N; i++) {
      var len = total * i / N, pt = trail.getPointAtLength(len);
      maxY = Math.max(maxY, pt.y);
      samples.push({ len: len, y: maxY });
    }
    function lenNear(pt) {
      var best = 0, bestD = Infinity;
      for (var i = 0; i <= N; i += 2) {
        var q = trail.getPointAtLength(samples[i].len), dd = (q.x - pt.x) * (q.x - pt.x) + (q.y - pt.y) * (q.y - pt.y);
        if (dd < bestD) { bestD = dd; best = samples[i].len; }
      }
      return best;
    }

    // flowers it pollinates on the way
    var bloomSpots = [
      { pt: points[2], petal: '#FFD500', heart: '#C84869' },
      { pt: trail.getPointAtLength((lenNear(points[2]) + lenNear(points[3])) / 2), petal: '#F6A5CC', heart: '#FF561C' },
      { pt: points[4], petal: '#FF561C', heart: '#FFD500' }
    ];
    var blooms = bloomSpots.map(function (b) {
      var made = makeBloom(b.pt.x, b.pt.y, b.petal, b.heart);
      trailSvg.appendChild(made.g);
      return { el: made.inner, len: lenNear(b.pt) };
    });

    flight = { trail: trail, reveal: reveal, total: total, samples: samples, blooms: blooms, start: points[0], end: points[points.length - 1], flipped: false };
  }

  function placeBird(x, y, flipped) {
    bird.style.transform = 'translate3d(' + (x - 36).toFixed(1) + 'px,' + (y - 29).toFixed(1) + 'px,0)';
    bird.classList.toggle('is-flipped', !!flipped);
  }

  function updateJourney() {
    if (!flight) return;
    if (!flightEnabled()) {
      // already landed beside the milagro
      trailSvg.style.display = 'none';
      placeBird(flight.end.x, flight.end.y, false);
      bird.classList.add('is-visible');
      return;
    }
    trailSvg.style.display = '';
    var anchor = window.scrollY + window.innerHeight * 0.55;
    var len;
    if (anchor <= flight.start.y) len = 0;
    else if (anchor >= flight.samples[flight.samples.length - 1].y) len = flight.total;
    else {
      var lo = 0, hi = flight.samples.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (flight.samples[mid].y < anchor) lo = mid + 1; else hi = mid; }
      len = flight.samples[lo].len;
    }

    var pt = flight.trail.getPointAtLength(len);
    var prev = flight.trail.getPointAtLength(Math.max(0, len - 6));
    var dx = pt.x - prev.x;
    if (Math.abs(dx) > 0.8) flight.flipped = dx > 0;            // drawn facing left; flip when heading right
    var landed = len >= flight.total - 1;
    var bob = landed ? 0 : Math.sin(len / 45) * 4;

    placeBird(pt.x, pt.y + bob, landed ? false : flight.flipped);
    bird.classList.toggle('is-visible', len > 0);
    flight.reveal.setAttribute('stroke-dashoffset', (flight.total - len).toFixed(1));
    flight.blooms.forEach(function (b) { b.el.classList.toggle('is-open', len >= b.len); });
    if (landed) openMilagro();
  }

  /* ---------- One scroll loop for the moving parts ---------- */
  var ticking = false;
  function onFrame() { ticking = false; updateParallax(); updateJourney(); }
  function requestFrame() { if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); } }
  window.addEventListener('scroll', requestFrame, { passive: true });

  var rebuildTimer;
  function rebuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(function () { buildJourney(); requestFrame(); }, 120);
  }
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body);
  window.addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  buildJourney();
  requestFrame();

  /* ---------- Build + rebuild on resize ---------- */
  buildPapel();
  var resizeTimer;
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastWidth) return;   // ignore mobile URL-bar height changes
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildPapel, 150);
  });
})();
