// Home page motion: fade the intro logo out while scrolling, and reveal
// game cards as they come into view.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cards = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    cards.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(function (el) { observer.observe(el); });
  }

  var intro = document.querySelector('.intro');
  if (!intro || reduceMotion) return;

  var ticking = false;
  function update() {
    ticking = false;
    var p = Math.min(Math.max(window.scrollY / (intro.offsetHeight * 0.7), 0), 1);
    intro.style.setProperty('--p', p.toFixed(3));
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
})();
