(function () {
  'use strict';

  const canvas = document.getElementById('earth-globe');
  if (!canvas || canvas.tagName !== 'CANVAS') return;

  const SIZE = 720;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2, R = SIZE / 2 - 1;

  // Continent outlines as [lon, lat] polygons (degrees)
  const CONTINENTS = [
    // North America
    [[-168,66],[-80,72],[-55,72],[-53,47],[-80,25],[-87,15],[-83,9],[-62,11],[-62,46],[-80,44],[-110,49],[-124,49],[-130,54],[-140,60],[-168,66]],
    // Greenland
    [[-55,76],[-17,76],[-17,63],[-42,60],[-55,76]],
    // South America
    [[-80,12],[-60,10],[-35,-6],[-52,-34],[-68,-56],[-75,-50],[-70,-10],[-80,12]],
    // Europe
    [[-10,36],[2,36],[28,42],[38,42],[28,70],[10,57],[0,51],[-10,44],[-10,36]],
    // Africa
    [[-17,15],[10,6],[42,12],[51,12],[43,-4],[18,-35],[-17,14],[-17,15]],
    // Asia (main body)
    [[30,42],[30,70],[170,70],[170,52],[130,32],[120,22],[100,4],[80,8],[58,22],[38,38],[30,42]],
    // Indian subcontinent
    [[60,24],[80,8],[80,22],[68,6],[60,24]],
    // Southeast Asia
    [[100,22],[100,2],[110,-1],[108,16],[100,22]],
    // Sumatra / Java strip
    [[96,5],[140,-8],[140,-6],[96,6],[96,5]],
    // Australia
    [[113,-22],[148,-20],[150,-38],[128,-34],[113,-22]],
    // Japan
    [[130,32],[142,38],[145,44],[134,43],[130,32]],
    // UK / Ireland
    [[-8,50],[2,51],[2,58],[-5,58],[-8,50]],
  ];

  // Orthographic projection: returns [screenX, screenY] or null if behind globe
  function project(lon, lat, viewLon) {
    const phi = lat * Math.PI / 180;
    const dl  = (lon - viewLon) * Math.PI / 180;
    const x3  =  Math.cos(phi) * Math.sin(dl);
    const y3  = -Math.sin(phi);
    const z3  =  Math.cos(phi) * Math.cos(dl);
    if (z3 <= 0) return null;
    return [cx + x3 * R, cy + y3 * R];
  }

  let viewLon = 0;

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();

    // Clip to sphere
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Ocean
    const ocean = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, R * 0.05, cx, cy, R * 1.05);
    ocean.addColorStop(0,   '#55d4ff');
    ocean.addColorStop(0.3, '#0d72bb');
    ocean.addColorStop(0.75,'#062040');
    ocean.addColorStop(1,   '#020c1e');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Continents
    ctx.fillStyle   = 'rgba(38, 155, 75, 0.90)';
    ctx.strokeStyle = 'rgba(70, 210, 110, 0.35)';
    ctx.lineWidth   = 1.5;

    for (const shape of CONTINENTS) {
      const pts = shape.map(([lo, la]) => project(lo, la, viewLon));
      if (pts.filter(Boolean).length < 3) continue;

      ctx.beginPath();
      let pen = false;
      for (const p of pts) {
        if (!p)       { pen = false; continue; }
        if (!pen)     { ctx.moveTo(p[0], p[1]); pen = true; }
        else            ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Ice caps (polar latitude bands)
    ctx.fillStyle = 'rgba(200, 235, 255, 0.48)';
    for (const [poleLat, step] of [[78, 15], [-72, 15]]) {
      const ring = [];
      for (let lo = -180; lo <= 180; lo += step) {
        const p = project(lo, poleLat, viewLon);
        if (p) ring.push(p);
      }
      if (ring.length > 2) {
        ctx.beginPath();
        ring.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Specular highlight (top-left)
    const spec = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx - R * 0.3, cy - R * 0.3, R * 0.65);
    spec.addColorStop(0, 'rgba(255,255,255,0.18)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Atmosphere glow at edge
    const atm = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
    atm.addColorStop(0, 'transparent');
    atm.addColorStop(1, 'rgba(100,200,255,0.22)');
    ctx.fillStyle = atm;
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.restore();

    // Night-side shadow (right hemisphere darkening)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    const night = ctx.createRadialGradient(cx + R * 0.5, cy, 0, cx + R * 0.35, cy, R * 1.15);
    night.addColorStop(0, 'transparent');
    night.addColorStop(0.55, 'transparent');
    night.addColorStop(1, 'rgba(0,4,18,0.60)');
    ctx.fillStyle = night;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();

    viewLon = (viewLon + 0.07) % 360;
    requestAnimationFrame(draw);
  }

  draw();
})();
