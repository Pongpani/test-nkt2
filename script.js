
// Hero slider auto transition
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dots .dot');
let currentSlide = 0;
let sliderTimer = null;

function showSlide(index) {
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === index);
  });
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });
  currentSlide = index;
}

function nextSlide() {
  const next = (currentSlide + 1) % slides.length;
  showSlide(next);
}

function startSlider() {
  if (sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(nextSlide, 5000);
}

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const idx = parseInt(dot.dataset.index, 10);
    showSlide(idx);
    startSlider();
  });
});

if (slides.length) {
  showSlide(0);
  startSlider();
}

// Lightbox fullscreen zoom
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.style.display = 'flex';
}

function closeLightbox() {
  lightbox.style.display = 'none';
  lightboxImg.src = '';
}

document.querySelectorAll('[data-lightbox]').forEach(img => {
  img.addEventListener('click', () => openLightbox(img.src));
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
