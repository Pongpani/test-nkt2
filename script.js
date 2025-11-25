const state = {
  data: null,
  slideIndex: 0,
  sliderTimer: null,
  weather: null,
  map: null,
  searchIndex: [],
  openLightbox: null
};

async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('Cannot load data.json');
  return res.json();
}

function buildHero(slides) {
  const slideWrap = document.getElementById('hero-slides');
  const dotWrap = document.getElementById('hero-dots');
  const progressWrap = document.getElementById('hero-progress');
  slideWrap.innerHTML = '';
  dotWrap.innerHTML = '';
  progressWrap.innerHTML = '';

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

    const bar = document.createElement('span');
    bar.dataset.index = index;
    progressWrap.appendChild(bar);
  });

  showSlide(0);
  startSlider();
}

function showSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('#hero-dots button');
  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  updateHeroProgress(index);
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

function updateHeroProgress(index) {
  const bars = document.querySelectorAll('.hero-progress span');
  bars.forEach((bar, i) => {
    bar.classList.toggle('active', i === index);
    if (i === index) {
      bar.style.setProperty('--fill', '0%');
      requestAnimationFrame(() => bar.style.setProperty('--fill', '100%'));
    } else {
      bar.style.setProperty('--fill', '0%');
    }
  });
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

function buildSearchIndex(data) {
  const explore = (data.explore || []).map(item => ({
    ...item,
    type: 'explore',
    meta: `${item.location || ''} · ${item.time || ''}`,
    keywords: `${item.title} ${item.description} ${item.location} ${item.time} river mekong cafe sunset temple art walk`.
      toLowerCase()
  }));

  const spots = (data.spots || []).map(item => ({
    ...item,
    type: 'spot',
    meta: `${item.area || ''} · ${item.tag || ''}`,
    keywords: `${item.title} ${item.area} ${item.tag} landmark market river mekong sunset cafe art temple view park`.toLowerCase()
  }));

  state.searchIndex = [...explore, ...spots];
  renderSearchResults(getSearchShowcase());
  updateSearchCount(state.searchIndex.length, 'live showcase');
  bindSearchEvents();
}

function getSearchShowcase() {
  const preferred = state.searchIndex.filter(item => item.type === 'explore').slice(0, 6);
  const addSpots = state.searchIndex.filter(item => item.type === 'spot').slice(0, 4);
  return [...preferred, ...addSpots];
}

function filterSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderSearchResults(getSearchShowcase());
    updateSearchCount(state.searchIndex.length, 'live showcase');
    return;
  }
  const tokens = q.split(/\s+/).filter(Boolean);
  const ranked = state.searchIndex
    .map(item => {
      const baseScore = item.type === 'explore' ? 2 : 1;
      const tokenScore = tokens.reduce((score, t) => {
        let s = score;
        if (item.title.toLowerCase().includes(t)) s += 3;
        if ((item.meta || '').toLowerCase().includes(t)) s += 2;
        if (item.keywords.includes(t)) s += 1;
        return s;
      }, baseScore);
      return { item, score: tokenScore };
    })
    .filter(entry => entry.score > 1)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item);

  renderSearchResults(ranked);
  updateSearchCount(ranked.length, q);
}

function renderSearchResults(list) {
  const wrap = document.getElementById('search-results');
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = '<div class="muted">ไม่พบผลลัพธ์ ลองคำหลักอื่น เช่น "สะพาน" หรือ "ตลาด"</div>';
    return;
  }

  wrap.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('article');
    card.className = 'search-card';
    card.innerHTML = `
      <div class="pill">${item.type === 'explore' ? 'EXPLORE' : 'BIG SPOT'}</div>
      <div class="search-thumb" style="background-image:url('${item.image}')"></div>
      <h5>${item.title}</h5>
      <small>${item.meta}</small>
      <p class="muted">${item.description || 'มุมไฮไลต์สำหรับแผนเที่ยววันนี้'}</p>
    `;
    card.addEventListener('click', () => handleSearchSelect(item));
    wrap.appendChild(card);
  });
}

function handleSearchSelect(item) {
  if (item.type === 'explore') {
    openExploreDetail(item);
  } else {
    focusMapOnSpot(item);
    if (state.openLightbox && item.image) state.openLightbox(item.image);
  }
}

function focusMapOnSpot(item) {
  const mapCard = document.getElementById('map');
  mapCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (state.map && item.coords) {
    state.map.setView(item.coords, 15, { animate: true });
    L.popup().setLatLng(item.coords).setContent(`<strong>${item.title}</strong><br>${item.area || ''} · ${item.tag || ''}`).openOn(state.map);
  }
}

function bindSearchEvents() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const chips = document.querySelectorAll('#search-chips button');
  if (!input) return;

  let timer;
  input.addEventListener('input', e => {
    const value = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => filterSearch(value), 160);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    filterSearch('');
    input.focus();
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query || '';
      input.value = q;
      filterSearch(q);
    });
  });
}

function updateSearchCount(count, queryLabel) {
  const counter = document.getElementById('search-count');
  if (!counter) return;
  const label = count === 0 ? 'no match' : `${count} results`;
  counter.textContent = `${label} • ${queryLabel}`;
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

  state.openLightbox = open;
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

  const pick = pickExploreForNow(hour, weather.condition);
  if (pick) updateConciergePick(pick, timeCue, weather.condition);
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

function parseTimeRange(str) {
  if (!str || !str.includes('-')) return { start: 0, end: 24 };
  const [startRaw, endRaw] = str.split('-');
  const parse = raw => {
    const [h, m = '0'] = raw.split('.');
    return parseInt(h, 10) + parseInt(m, 10) / 60;
  };
  return { start: parse(startRaw), end: parse(endRaw) };
}

function pickExploreForNow(hour, condition) {
  const list = state.data?.explore || [];
  if (!list.length) return null;
  const matches = list.filter(item => {
    const range = parseTimeRange(item.time);
    return hour >= range.start && hour <= range.end;
  });
  let pool = matches.length ? matches : list;
  if (condition.toLowerCase().includes('rain')) {
    const indoor = pool.filter(item => /คาเฟ่|วัด|ตลาด|แกลเลอรี|ศิลป์/i.test(`${item.title} ${item.description}`));
    if (indoor.length) pool = indoor;
  }
  const index = hour % pool.length;
  return pool[index];
}

function updateConciergePick(item, timeCue, condition) {
  const box = document.getElementById('concierge-pick');
  if (!box) return;
  box.classList.add('highlight');
  box.querySelector('.value').innerHTML = `${item.title}<br><small>${item.location} · ${item.time}</small>`;
  box.querySelector('small').textContent = `${timeCue} • ${condition}`;
  box.onclick = () => openExploreDetail(item);
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

  state.map = map;
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
    buildSearchIndex(state.data);
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
