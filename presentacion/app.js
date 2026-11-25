/* Adriana Tienda — deck controller
   16:9 stage scaled to fit the viewport, keyboard / swipe / dot navigation. */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dotsWrap = document.getElementById('dots');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var currentNum = document.getElementById('currentNum');
  var totalNum = document.getElementById('totalNum');
  var progressFill = document.getElementById('progressFill');

  var index = 0;
  var total = slides.length;

  totalNum.textContent = String(total);

  /* Build dots */
  slides.forEach(function (slide, i) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1) + ': ' + (slide.dataset.title || ''));
    dot.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  /* Scale the 1280x720 stage to the viewport */
  function fit() {
    var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720) * 0.97;
    slides.forEach(function (slide) {
      slide.style.setProperty('--scale', scale.toFixed(4));
    });
  }

  function render() {
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    currentNum.textContent = String(index + 1);
    progressFill.style.width = ((index + 1) / total) * 100 + '%';
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    var title = slides[index].dataset.title;
    document.title = 'Adriana Tienda · ' + (title || '') + ' (' + (index + 1) + '/' + total + ')';
  }

  function goTo(i) {
    if (i < 0 || i >= total || i === index) return;
    index = i;
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  document.addEventListener('keydown', function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        event.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        prev();
        break;
      case 'Home':
        event.preventDefault();
        goTo(0);
        break;
      case 'End':
        event.preventDefault();
        goTo(total - 1);
        break;
      default:
        break;
    }
  });

  /* Touch / swipe */
  var touchStartX = null;
  var touchStartY = null;
  stage.addEventListener('touchstart', function (event) {
    var touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  stage.addEventListener('touchend', function (event) {
    if (touchStartX === null || touchStartY === null) return;
    var touch = event.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  }, { passive: true });

  window.addEventListener('resize', fit);

  /* Deep link: index.html#5 opens slide 5 */
  var hashMatch = window.location.hash.match(/^#(\d+)$/);
  if (hashMatch) {
    var fromHash = parseInt(hashMatch[1], 10) - 1;
    if (fromHash >= 0 && fromHash < total) index = fromHash;
  }

  fit();
  render();

  /* QA mode (?qa): measure overflow on every slide and print a report.
     Used by the CI/preview check; inert during normal presentation. */
  if (window.location.search.indexOf('qa') !== -1) {
    var report = [];
    slides.forEach(function (slide, i) {
      var sr = slide.getBoundingClientRect();
      var issues = [];
      if (slide.scrollHeight > slide.clientHeight + 2) {
        issues.push('vertical overflow: ' + slide.scrollHeight + ' > ' + slide.clientHeight);
      }
      if (slide.scrollWidth > slide.clientWidth + 2) {
        issues.push('horizontal overflow: ' + slide.scrollWidth + ' > ' + slide.clientWidth);
      }
      Array.prototype.forEach.call(slide.querySelectorAll('*'), function (el) {
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.right > sr.right + 2 || r.left < sr.left - 2) {
          issues.push('out of bounds <' + el.tagName.toLowerCase() + '> "' +
            (el.textContent || '').trim().slice(0, 28) + '"');
        }
      });
      report.push((issues.length ? 'FAIL' : 'PASS') + ' slide ' + (i + 1) +
        (slide.dataset.title ? ' · ' + slide.dataset.title : '') +
        (issues.length ? '\n  - ' + issues.slice(0, 6).join('\n  - ') : ''));
      /* Node overlap check (map slide) */
      var nodes = Array.prototype.slice.call(slide.querySelectorAll('.map-node'));
      if (nodes.length > 1) {
        for (var a = 0; a < nodes.length; a += 1) {
          for (var b = a + 1; b < nodes.length; b += 1) {
            var ra = nodes[a].getBoundingClientRect();
            var rb = nodes[b].getBoundingClientRect();
            var overlap = !(ra.right <= rb.left || rb.right <= ra.left || ra.bottom <= rb.top || rb.bottom <= ra.top);
            if (overlap) {
              issues.push('map nodes overlap: "' + (nodes[a].textContent || '').trim() +
                '" × "' + (nodes[b].textContent || '').trim() + '"');
            }
          }
        }
        if (issues.length) {
          report[report.length - 1] = 'FAIL slide ' + (i + 1) +
            (slide.dataset.title ? ' · ' + slide.dataset.title : '') +
            '\n  - ' + issues.slice(0, 8).join('\n  - ');
        }
      }
    });
    var pre = document.createElement('pre');
    pre.id = 'qa-report';
    pre.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9999;background:#fff;color:#000;font:11px monospace;padding:10px;max-height:90vh;overflow:auto;margin:0;white-space:pre-wrap';
    pre.textContent = report.join('\n');
    document.body.appendChild(pre);
  }
})();
