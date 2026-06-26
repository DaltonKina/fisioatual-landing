(function () {
  'use strict';
  var v = document.getElementById('earth-globe');
  if (!v || v.tagName !== 'VIDEO') return;
  function setRate() {
    v.defaultPlaybackRate = 0.01;
    v.playbackRate = 0.01;
  }
  setRate();
  v.addEventListener('canplay', setRate);
  v.addEventListener('play', setRate);
})();
