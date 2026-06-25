// ========== ANIMATED COUNTER ==========
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el) {
  const raw = el.dataset.target || '0';
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = parseInt(el.dataset.duration) || 2000;
  const decimals = parseInt(el.dataset.decimals) || 0;

  // Parse number — strip non-numeric except dot/comma
  const numStr = raw.replace(/[^0-9.,]/g, '').replace(',', '.');
  const target = parseFloat(numStr);

  if (isNaN(target)) { el.textContent = prefix + raw + suffix; return; }

  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = target * eased;

    let display;
    if (decimals > 0) {
      display = current.toFixed(decimals);
    } else {
      display = Math.round(current).toLocaleString('pt-BR');
    }

    // Re-add commas/formatting from original
    el.textContent = prefix + display + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Show final value as formatted
      el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('pt-BR')) + suffix;
    }
  }

  requestAnimationFrame(update);
}

// Observe stat cards and trigger on enter
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('[data-counter]');
      counters.forEach(animateCounter);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });

// Observe the stats section
const statsSection = document.querySelector('#mercado');
if (statsSection) counterObserver.observe(statsSection);
