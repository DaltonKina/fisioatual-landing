(function () {
  'use strict';
  var v = document.getElementById('earth-globe');
  if (!v || v.tagName !== 'VIDEO') return;
  // 0.1 = 10x mais lento; browser clamp mínimo ~0.0625 (seguro)
  v.defaultPlaybackRate = 0.1;
  v.playbackRate = 0.1;
})();
