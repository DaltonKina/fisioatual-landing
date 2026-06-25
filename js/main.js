// ========== NAVIGATION ==========
const nav = document.querySelector('.nav');
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.nav__mobile');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('.nav__mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ========== SCROLL REVEAL ==========
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ========== BENEFITS TABS ==========
const tabs = document.querySelectorAll('.benefits__tab');
const panels = document.querySelectorAll('.benefits__panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => {
      p.style.display = p.dataset.panel === target ? 'grid' : 'none';
    });
    tab.classList.add('active');
  });
});

// ========== FAQ ACCORDION ==========
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const content = item.querySelector('.accordion-content');
    const inner = item.querySelector('.accordion-content-inner');
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.accordion-item.open').forEach(openItem => {
      const c = openItem.querySelector('.accordion-content');
      c.style.maxHeight = '0';
      openItem.classList.remove('open');
    });

    if (!isOpen) {
      item.classList.add('open');
      content.style.maxHeight = inner.scrollHeight + 'px';
    }
  });
});

// ========== VIDEO PLAYER ==========
document.querySelectorAll('.video-wrapper').forEach(wrapper => {
  const video = wrapper.querySelector('video');
  const playBtn = wrapper.querySelector('.video-play-btn');

  if (!video || !playBtn) return;

  wrapper.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playBtn.style.opacity = '0';
      playBtn.style.transform = 'translate(-50%, -50%) scale(0.8)';
    } else {
      video.pause();
      playBtn.style.opacity = '1';
      playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });

  video.addEventListener('ended', () => {
    playBtn.style.opacity = '1';
    playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
  });
});

// ========== HERO VIDEO FALLBACK ==========
const heroVideo = document.querySelector('.hero__video-bg video');
if (heroVideo) {
  heroVideo.play().catch(() => {
    heroVideo.parentElement.style.display = 'none';
  });
}

// ========== ACTIVE NAV LINK ==========
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === '#' + entry.target.id
        );
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => sectionObserver.observe(s));
