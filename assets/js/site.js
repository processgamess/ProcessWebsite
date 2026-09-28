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

  // Gameplay videos: once the image has been fully on screen for VIDEO_DELAY,
  // a clip fades in over it. As soon as it is no longer fully visible the
  // clip pauses and the image shows again; when it is fully back on screen
  // the clip resumes where it stopped. Skipped for reduced motion and data
  // saver.
  var VIDEO_DELAY = 1000;
  var saveData = navigator.connection && navigator.connection.saveData;
  var frames = document.querySelectorAll('[data-video]');
  if (!reduceMotion && !saveData && canObserve && frames.length) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var frame = entry.target;
        frame._visible = isFullyVisible(entry);
        if (frame._visible) {
          if (frame._video) {
            playVideo(frame);
          } else if (!frame._timer) {
            frame._timer = setTimeout(function () { startVideo(frame); }, VIDEO_DELAY);
          }
        } else {
          clearTimeout(frame._timer);
          frame._timer = null;
          if (frame._video) {
            frame._video.pause();
            frame._video.classList.remove('is-playing');
          }
        }
      });
    }, { threshold: [0, 0.5, 0.9, 0.95, 0.99, 1] });
    frames.forEach(function (el) { videoObserver.observe(el); });
  }

  // "Fully visible" allows for sub-pixel rounding, and also counts an image
  // taller than the viewport (e.g. a phone in landscape) once it fills it.
  function isFullyVisible(entry) {
    if (!entry.isIntersecting) return false;
    if (entry.intersectionRatio >= 0.99) return true;
    var root = entry.rootBounds;
    return !!root && entry.intersectionRect.height >= root.height - 2;
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
      // Playback can start after the frame has already scrolled out of view.
      if (frame._visible) {
        video.classList.add('is-playing');
      } else {
        video.pause();
      }
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

  // Count the download stat up from 0 as it fades in (the HTML already
  // holds the final number, so it reads correctly without JS).
  var count = intro.querySelector('[data-count]');
  if (count) {
    var target = parseInt(count.getAttribute('data-count'), 10);
    var COUNT_START = 950, COUNT_DURATION = 1400;
    count.textContent = '0';
    setTimeout(function () {
      var start = null;
      function step(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / COUNT_DURATION, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        count.textContent = String(Math.round(target * eased));
        if (t < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }, COUNT_START);
  }

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
