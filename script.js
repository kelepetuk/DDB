const revealItems = document.querySelectorAll('.reveal');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const modal = document.getElementById('certificate-modal');
const modalClose = modal?.querySelector('.modal-close');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalFrame = document.getElementById('modal-frame');
const modalImage = document.getElementById('modal-image');
const modalMessage = document.getElementById('modal-message');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const contactDeviceStorageKey = 'portfolioContactDeviceId';
const projectCarousel = document.querySelector('[data-project-carousel]');
let modalTrigger = null;

function getContactDeviceId() {
  try {
    let deviceId = window.localStorage.getItem(contactDeviceStorageKey);
    if (!/^[a-f0-9]{64}$/i.test(deviceId || '')) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      deviceId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      window.localStorage.setItem(contactDeviceStorageKey, deviceId);
    }
    return deviceId;
  } catch {
    return '';
  }
}

function revealOnScroll() {
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      item.classList.add('visible');
    }
  });
}

function toggleMenu() {
  const isOpen = document.body.classList.toggle('menu-open');
  navToggle?.setAttribute('aria-expanded', String(isOpen));
  navToggle?.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  navToggle?.setAttribute('aria-expanded', 'false');
  navToggle?.setAttribute('aria-label', 'Open navigation');
}

function closeModal() {
  if (!modal) return;
  const trigger = modalTrigger;
  modalTrigger = null;
  modal.classList.remove('visible');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (modalFrame) {
    modalFrame.src = '';
    modalFrame.hidden = false;
  }
  if (modalImage) {
    modalImage.onload = null;
    modalImage.onerror = null;
    modalImage.src = '';
    modalImage.alt = '';
    modalImage.hidden = true;
  }
  if (modalMessage) {
    modalMessage.textContent = 'The uploaded certificate PDF will appear here once the file is available.';
    modalMessage.hidden = false;
  }
  trigger?.focus();
}

function openModal(button) {
  if (!modal || !modalTitle || !modalSubtitle) return;

  modalTrigger = button;
  const card = button.closest('.certificate-card');

  // prefer dataset values unless they are placeholder markers like "[Add ...]"
  const rawTitle = button.dataset.title || '';
  const datasetHasPlaceholder = (s) => !s || s.includes('[Add') || s.trim().startsWith('[');
  const title = !datasetHasPlaceholder(rawTitle)
    ? rawTitle
    : (card?.querySelector('.certificate-details h3')?.textContent?.trim() || 'Certificate Preview');

  const rawOrg = button.dataset.org || '';
  const org = !datasetHasPlaceholder(rawOrg)
    ? rawOrg
    : (card?.querySelectorAll('.certificate-details p')[0]?.textContent?.replace(/^[^:]+:\s*/, '').trim() || '');

  const rawDate = button.dataset.date || '';
  const date = !datasetHasPlaceholder(rawDate)
    ? rawDate
    : (card?.querySelectorAll('.certificate-details p')[1]?.textContent?.replace(/^[^:]+:\s*/, '').trim() || '');

  modalTitle.textContent = title;
  modalSubtitle.textContent = [org, date].filter(Boolean).join(' • ');

  const file = button.dataset.file || '';
  const isImage = /\.(?:png|jpe?g|gif|webp|bmp|avif)(?:[?#]|$)/i.test(file);
  if (modalFrame) {
    modalFrame.hidden = isImage;
    modalFrame.src = file && !isImage ? `${file}#view=FitH&zoom=page-width` : '';
  }
  if (modalMessage) {
    modalMessage.textContent = button.dataset.file ? 'Loading certificate preview...' : 'No certificate file is available yet.';
    modalMessage.hidden = false;
  }
  if (modalImage) {
    modalImage.hidden = !isImage;
    if (isImage) {
      modalImage.alt = `${title} certificate`;
      modalImage.onload = () => {
        if (modalMessage) modalMessage.hidden = true;
      };
      modalImage.onerror = () => {
        modalImage.hidden = true;
        if (modalMessage) {
          modalMessage.textContent = 'Unable to load the certificate image.';
          modalMessage.hidden = false;
        }
      };
      modalImage.src = file;
    }
  }
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  modalClose?.focus();
}

function initializeProjectCarousel() {
  if (!projectCarousel) return;

  const track = projectCarousel.querySelector('#project-carousel-track');
  const viewport = projectCarousel.querySelector('.project-carousel-viewport');
  const slides = Array.from(track?.querySelectorAll('.project-card') || []);
  const previousButton = projectCarousel.querySelector('[data-carousel-previous]');
  const nextButton = projectCarousel.querySelector('[data-carousel-next]');
  const dots = projectCarousel.querySelector('.project-carousel-dots');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!track || !viewport || !slides.length || !previousButton || !nextButton || !dots) return;

  let activeIndex = 0;
  let timer = null;
  let pointerStartX = null;

  const stopAutoplay = () => {
    window.clearInterval(timer);
    timer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (
      reducedMotion.matches ||
      document.hidden ||
      projectCarousel.matches(':hover') ||
      projectCarousel.contains(document.activeElement)
    ) return;

    timer = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, 7000);
  };

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.inert = !isActive;
      dots.children[slideIndex]?.setAttribute('aria-current', String(isActive));
    });
  };

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show project ${index + 1} of ${slides.length}`);
    dot.addEventListener('click', () => {
      showSlide(index);
      startAutoplay();
    });
    dots.append(dot);
  });

  previousButton.addEventListener('click', () => {
    showSlide(activeIndex - 1);
    startAutoplay();
  });
  nextButton.addEventListener('click', () => {
    showSlide(activeIndex + 1);
    startAutoplay();
  });
  projectCarousel.addEventListener('mouseenter', stopAutoplay);
  projectCarousel.addEventListener('mouseleave', startAutoplay);
  projectCarousel.addEventListener('focusin', stopAutoplay);
  projectCarousel.addEventListener('focusout', (event) => {
    if (!projectCarousel.contains(event.relatedTarget)) startAutoplay();
  });
  projectCarousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(activeIndex - 1);
      startAutoplay();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showSlide(activeIndex + 1);
      startAutoplay();
    }
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') pointerStartX = event.clientX;
  });
  viewport.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 50) return;
    showSlide(activeIndex + (distance < 0 ? 1 : -1));
    startAutoplay();
  });
  viewport.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });

  document.addEventListener('visibilitychange', startAutoplay);
  reducedMotion.addEventListener('change', () => {
    stopAutoplay();
    startAutoplay();
  });

  showSlide(0);
  startAutoplay();
}

function loadRecaptcha(siteKey) {
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.onload = () => {
      if (window.grecaptcha?.execute) {
        resolve(window.grecaptcha);
      } else {
        reject(new Error('reCAPTCHA could not be initialized.'));
      }
    };
    script.onerror = () => reject(new Error('reCAPTCHA could not be loaded.'));
    document.head.append(script);
  });
}

async function handleContactSubmit(event) {
  event.preventDefault();

  if (!contactForm || !formStatus) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  if (!submitButton) return;
  const originalButtonText = submitButton.textContent || 'Send Message';

  formStatus.textContent = 'Sending your message...';
  formStatus.className = 'form-status';
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const hp = contactForm.querySelector('#hp_website');
    if (hp?.value.trim()) {
      formStatus.textContent = 'Unable to send message.';
      formStatus.className = 'form-status error';
      return;
    }

    const formData = new FormData(contactForm);
    const siteKey = contactForm.dataset.recaptchaSiteKey;
    if (siteKey) {
      const recaptcha = await loadRecaptcha(siteKey);
      const token = await new Promise((resolve) => recaptcha.ready(resolve))
        .then(() => recaptcha.execute(siteKey, { action: 'contact' }));
      formData.set('g-recaptcha-response', token);
    }

    const deviceId = getContactDeviceId();
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    };
    if (deviceId) headers['X-Contact-Device'] = deviceId;

    const response = await fetch(contactForm.action, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: new URLSearchParams(formData)
    });

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Unable to send your message right now.');
    }

    formStatus.textContent = 'Thank you! Your message has been sent successfully.';
    formStatus.className = 'form-status success';
    contactForm.reset();
  } catch (error) {
    formStatus.className = 'form-status error';
    formStatus.replaceChildren(
      document.createTextNode(
        error instanceof TypeError
          ? 'Unable to send your message from this page. You can '
          : `${error instanceof Error ? error.message : 'Something went wrong.'} You can `
      )
    );
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:darelledoriaboragay@gmail.com?${new URLSearchParams({
      subject: 'Portfolio contact',
      body: [
        `Name: ${contactForm.querySelector('input[name="name"]')?.value || ''}`,
        `Email: ${contactForm.querySelector('input[name="email"]')?.value || ''}`,
        '',
        contactForm.querySelector('textarea[name="message"]')?.value || ''
      ].join('\n')
    })}`;
    emailLink.textContent = 'email me directly';
    formStatus.append(emailLink, document.createTextNode(' instead.'));
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

window.addEventListener('load', () => {
  revealOnScroll();
});

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('resize', () => {
  if (window.innerWidth > 1100) {
    closeMenu();
  }
});

navToggle?.addEventListener('click', toggleMenu);
initializeProjectCarousel();

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    closeMenu();
  });
});

contactForm?.addEventListener('submit', handleContactSubmit);

document.querySelectorAll('[data-cert]').forEach((button) => {
  button.addEventListener('click', () => openModal(button));
});

modal?.addEventListener('click', (event) => {
  if (event.target === modal || event.target.classList.contains('modal-close')) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (modal?.classList.contains('visible')) {
      closeModal();
    } else {
      closeMenu();
    }
  }

  if (event.key === 'Tab' && modal?.classList.contains('visible')) {
    const focusable = modal.querySelectorAll('button:not([disabled]), a[href], iframe:not([hidden]), img:not([hidden])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

document.addEventListener('click', (event) => {
  if (
    document.body.classList.contains('menu-open') &&
    !navToggle?.contains(event.target) &&
    !navLinks?.contains(event.target)
  ) {
    closeMenu();
  }
});
