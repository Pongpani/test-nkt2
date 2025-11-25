const state = {
  data: null,
  slideIndex: 0,
  sliderTimer: null,
  weather: null
};

async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('Cannot load data.json');
  return res.json();
}

function buildHero(slides) {
  const slideWrap = document.getElementById('hero-slides');
  const dotWrap = document.getElementById('hero-dots');
  slideWrap.innerHTML = '';
  dotWrap.innerHTML = '';

  slides.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.style.backgroundImage = `url('${item.image}')`;
    slide.innerHTML = `
      <div class="slide-meta">
        <p>${item.subtitle}</p>
        <h4>${item.title}</h4>
        <span>${item.description}</span>
      </div>
    `;
    slideWrap.appendChild(slide);

    const dot = document.createElement('button');
    dot.dataset.index = index;
    dot.addEventListener('click', () => {
      showSlide(index);
      startSlider();
    });
    dotWrap.appendChild(dot);
  });

  showSlide(0);
  startSlider();
}

function showSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('#hero-dots button');
  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  state.slideIndex = index;
}

function startSlider() {
  clearInterval(state.sliderTimer);
  state.sliderTimer = setInterval(() => {
    const slides = document.querySelectorAll('.hero-slide');
    const next = (state.slideIndex + 1) % slides.length;
    showSlide(next);
  }, 6000);
}

function buildExplore(list) {
  const grid = document.getElementById('explore-grid');
  grid.innerHTML = '';
  list.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'explore-card';
    card.dataset.index = index;
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" />
      <div class="caption">
        ${item.title}
        <small>${item.location || ''} · ${item.time || ''}</small>
      </div>
    `;
    card.addEventListener('click', () => openExploreDetail(item));
    grid.appendChild(card);
  });
}

function buildSpots(list) {
  const grid = document.getElementById('spots-grid');
  grid.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('article');
    card.className = 'spot-card';
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" data-lightbox="${item.image}" />
      <div class="spot-meta">
        <h4>${item.title}</h4>
        <span class="spot-pill">${item.area} · ${item.tag}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function buildStrips(rows) {
  const wrap = document.getElementById('strip-rows');
  wrap.innerHTML = '';
  rows.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'strip-row';
    row.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'strip';
      img.setAttribute('data-lightbox', src);
      rowEl.appendChild(img);
    });
    wrap.appendChild(rowEl);
  });
}

function buildMasonry(list) {
  const grid = document.getElementById('masonry-grid');
  grid.innerHTML = '';
  list.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'gallery';
    img.className = 'masonry-img';
    img.setAttribute('data-lightbox', src);
    grid.appendChild(img);
  });
}

function buildFestivals(list) {
  const wrap = document.getElementById('festival-cards');
  wrap.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'festival-card';
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" data-lightbox="${item.image}" />
      <div class="overlay">
        <h4>${item.title}</h4>
        <p>${item.description}</p>
      </div>
    `;
    wrap.appendChild(card);
  });
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');

  function open(src) {
    lightboxImg.src = src;
    lightbox.style.display = 'flex';
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function close() {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
    lightbox.setAttribute('aria-hidden', 'true');
  }

  document.body.addEventListener('click', e => {
    const target = e.target;
    const src = target?.dataset?.lightbox;
    if (src) {
      open(src);
    }
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

function openExploreDetail(item) {
  const overlay = document.getElementById('explore-detail');
  if (!overlay) return;
  overlay.querySelector('.detail-img').src = item.image;
  overlay.querySelector('.detail-img').alt = item.title;
  overlay.querySelector('.detail-title').textContent = item.title;
  overlay.querySelector('.detail-desc').textContent = item.description || '';
  overlay.querySelector('[data-meta="location"]').textContent = item.location || 'Nongkhai';
  overlay.querySelector('[data-meta="time"]').textContent = item.time || 'All day';
  const linkEl = overlay.querySelector('.detail-link');
  if (item.link) {
    linkEl.href = item.link;
    linkEl.style.display = 'inline-flex';
  } else {
    linkEl.style.display = 'none';
  }
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
}

function closeExploreDetail() {
  const overlay = document.getElementById('explore-detail');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}

function bindExploreDetailEvents() {
  const overlay = document.getElementById('explore-detail');
  if (!overlay) return;
  const closeBtn = overlay.querySelector('.detail-close');
  closeBtn?.addEventListener('click', closeExploreDetail);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeExploreDetail(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeExploreDetail(); });
}

async function loadWeather() {
  const box = document.getElementById('weather-box');
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.878&longitude=102.741&current_weather=true');
    if (!res.ok) throw new Error('Network');
    const data = await res.json();
    const w = data.current_weather;
    const condition = mapWeatherCode(w.weathercode);
    const value = `${Math.round(w.temperature)}°C · ${condition}`;
    box.querySelector('.value').textContent = value;
    box.querySelector('small').textContent = `ลม ${w.windspeed} km/h | อัปเดตสด`;
    state.weather = { temp: w.temperature, code: w.weathercode, condition };
    updateSmartSuggestion();
  } catch (err) {
    box.querySelector('.value').textContent = 'ข้อมูลชั่วคราว: 29°C · Clear';
    box.querySelector('small').textContent = 'ไม่สามารถดึงข้อมูลเรียลไทม์';
    state.weather = { temp: 29, code: 0, condition: 'Clear' };
    updateSmartSuggestion();
  }
}

function mapWeatherCode(code) {
  const mapping = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 80: 'Rain showers'
  };
  return mapping[code] || 'Variable';
}

function updateSmartSuggestion() {
  const box = document.getElementById('suggestion-box');
  if (!box) return;
  const weather = state.weather || { temp: 28, condition: 'Clear' };
  const hour = new Date().getHours();

  let timeCue = 'ช่วงบ่ายนุ่มนวล';
  if (hour < 11) timeCue = 'เช้าแสงทอง';
  else if (hour < 16) timeCue = 'บ่ายสบาย';
  else if (hour < 20) timeCue = 'เย็นริมโขง';
  else timeCue = 'ค่ำคืนตลาด';

  let rec;
  if (weather.condition.toLowerCase().includes('rain')) {
    rec = 'เลือกคาเฟ่กระจกหรือหอศิลป์ใกล้ที่พัก พร้อมชมแม่น้ำโขงยามฝนโปรย';
  } else if (hour >= 17) {
    rec = 'เดินเล่นริมโขง รอชมพระอาทิตย์ตกและไฟสะพานมิตรภาพ';
  } else if (hour <= 10) {
    rec = 'ปั่นจักรยานเส้นทางริมน้ำ รับลมเช้าและหมอกบาง';
  } else {
    rec = 'แวะวัดโพธิ์ชัยและตลาดท่าเสด็จ ก่อนจิบกาแฟสโลว์บาร์';
  }

  box.querySelector('.value').textContent = `${timeCue} • ${weather.condition}`;
  box.querySelector('small').textContent = rec;

  buildConciergeList(timeCue, rec, weather.temp);
}

function buildConciergeList(timeCue, rec, temp) {
  const list = document.getElementById('concierge-list');
  if (!list) return;
  const cues = [
    { title: 'เวลานี้', text: timeCue },
    { title: 'อุณหภูมิ', text: `${Math.round(temp)}°C` },
    { title: 'ข้อแนะนำ', text: rec }
  ];
  list.innerHTML = cues.map(c => `<li><strong>${c.title}</strong><br>${c.text}</li>`).join('');
}

function initMap(spots) {
  const map = L.map('leaflet-map').setView([17.8782, 102.7414], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  spots.slice(0, 8).forEach(s => {
    if (!s.coords) return;
    L.marker(s.coords).addTo(map).bindPopup(`<strong>${s.title}</strong><br>${s.area} · ${s.tag}`);
  });
}

async function init() {
  try {
    state.data = await loadData();
    buildHero(state.data.hero);
    buildExplore(state.data.explore);
    buildSpots(state.data.spots);
    buildStrips(state.data.stripRows);
    buildMasonry(state.data.masonry);
    buildFestivals(state.data.festivals);
    initMap(state.data.spots);
    initLightbox();
    bindExploreDetailEvents();
    loadWeather();
    updateSmartSuggestion();
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
