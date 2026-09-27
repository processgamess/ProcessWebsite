// Site motion: fade the home intro logo out while scrolling, reveal game
// cards as they come into view, and swap game images for a short gameplay
// video once they have been on screen for a moment.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  // Card reveal
  var cards = document.querySelectorAll('.reveal');
  if (reduceMotion || !canObserve) {
    cards.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(function (el) { revealObserver.observe(el); });
  }

  // Gameplay videos: start after the image has been visible for VIDEO_DELAY,
  // pause when scrolled away. Skipped for reduced motion and data saver.
  var VIDEO_DELAY = 2000;
  var saveData = navigator.connection && navigator.connection.saveData;
  var frames = document.querySelectorAll('[data-video]');
  if (!reduceMotion && !saveData && canObserve && frames.length) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var frame = entry.target;
        if (entry.isIntersecting) {
          if (frame._video) {
            playVideo(frame);
          } else if (!frame._timer) {
            frame._timer = setTimeout(function () { startVideo(frame); }, VIDEO_DELAY);
          }
        } else {
          clearTimeout(frame._timer);
          frame._timer = null;
          if (frame._video) frame._video.pause();
        }
      });
    }, { threshold: 0.6 });
    frames.forEach(function (el) { videoObserver.observe(el); });
  }

  function startVideo(frame) {
    frame._timer = null;
    var video = document.createElement('video');
    video.className = 'media__video';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';
    // data-video is the path without extension; the browser picks the first
    // format it can play (H.264 MP4 almost everywhere, VP9 WebM otherwise).
    var base = frame.getAttribute('data-video');
    [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(function (format) {
      var source = document.createElement('source');
      source.src = base + '.' + format[0];
      source.type = format[1];
      video.appendChild(source);
    });
    video.addEventListener('playing', function () {
      video.classList.add('is-playing');
    });
    frame._video = video;
    frame.appendChild(video);
    playVideo(frame);
  }

  function playVideo(frame) {
    var promise = frame._video.play();
    // Autoplay can be refused (e.g. iOS Low Power Mode); the image stays.
    if (promise && promise.catch) promise.catch(function () {});
  }

  // Home intro fade on scroll
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
