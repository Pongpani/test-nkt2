const state = {
  data: null,
  searchIndex: [],
  searchLens: 'all'
};

async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('Cannot load data.json');
  return res.json();
}

function buildSearchIndex(data) {
  const explore = (data.explore || []).map(item => ({
    ...item,
    type: 'explore',
    meta: `${item.location || ''} · ${item.time || ''}`.trim(),
    lenses: deriveLenses(item),
    keywords: buildKeywords(item, `${item.title} ${item.description} ${item.location} ${item.time} river mekong cafe sunset temple art walk`)
  }));

  state.searchIndex = explore;
  renderSearchPlaceholder('พิมพ์หรือเลือกเลนส์เพื่อแสดง 12 จุดทั้งหมด');
  updateSearchCount(0, 'search idle');
  updateSearchStatus('ยังไม่เริ่มค้นหา • แสดงผลเมื่อมีคำหลักหรือตัวกรอง');
  bindSearchEvents();
}

function buildKeywords(item, base) {
  const text = `${base}`.toLowerCase();
  const synonyms = {
    'ริมโขง': 'river mekong riverside',
    'ตลาด': 'market night bazaar streetfood',
    'วัด': 'temple culture faith',
    'sunset': 'bluehour dusk golden hour',
    'cafe': 'coffee slowbar brunch'
  };
  const lensWords = deriveLenses(item).join(' ');
  const synonymText = Object.values(synonyms).join(' ');
  return `${text} ${lensWords} ${synonymText}`;
}

function deriveLenses(item) {
  const lens = ['all'];
  const text = `${item.title} ${item.description || ''} ${item.location || ''} ${item.tag || ''} ${item.time || ''}`.toLowerCase();
  if (/rimkong|ริมโขง|river|mekong/.test(text)) lens.push('river');
  if (/วัด|temple|ศิลป์|art|gallery/.test(text)) lens.push('culture');
  if (/คาเฟ่|cafe|coffee|slow/.test(text)) lens.push('cafe');
  if (/night|ตลาด|sunset|ค่ำ|blue/.test(text)) lens.push('night');
  if (/เช้า|morning|dawn|fog/.test(text)) lens.push('dawn');
  return Array.from(new Set(lens));
}

function getShowcase() {
  const hour = new Date().getHours();
  let moodLens = state.searchLens;
  if (moodLens === 'all') {
    if (hour < 10) moodLens = 'dawn';
    else if (hour < 16) moodLens = 'river';
    else if (hour < 20) moodLens = 'cafe';
    else moodLens = 'night';
  }
  const pool = state.searchIndex.filter(item => moodLens === 'all' || item.lenses?.includes(moodLens));
  return pool.length ? pool : state.searchIndex;
}

function filterSearch(query) {
  const q = query.trim().toLowerCase();
  const lens = state.searchLens;
  if (!q) {
    if (lens === 'all') {
      renderSearchPlaceholder('พิมพ์คำหลัก หรือเลือกเลนส์ด้านบนเพื่อดูผลลัพธ์');
      updateSearchCount(0, 'search idle');
      updateSearchStatus('ยังไม่เริ่มค้นหา • แสดงผลเมื่อมีคำหลัก');
      return;
    }

    const lensList = state.searchIndex.filter(item => item.lenses?.includes(lens));
    renderSearchResults(lensList);
    updateSearchCount(lensList.length, getLensLabel(lens));
    updateSearchStatus(`โหมด ${getLensLabel(lens)} • คัดเฉพาะจุดที่ตรงเลนส์`);
    return;
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const ranked = state.searchIndex
    .filter(item => lens === 'all' || item.lenses?.includes(lens))
    .map(item => {
      const lensBoost = lens !== 'all' && item.lenses?.includes(lens) ? 3 : 0;
      const timeBoost = scoreTimeMatch(item.time);
      const tokenScore = tokens.reduce((score, t) => {
        let s = score;
        if (item.title.toLowerCase().includes(t)) s += 4;
        if ((item.meta || '').toLowerCase().includes(t)) s += 3;
        if (item.keywords.includes(t)) s += 2;
        return s;
      }, 2 + lensBoost + timeBoost);
      return { item, score: tokenScore };
    })
    .filter(entry => entry.score > 2)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item);

  renderSearchResults(ranked);
  updateSearchCount(ranked.length, q || '');
  updateSearchStatus(`คำค้น "${query}" • จัดอันดับตามความใกล้เคียงและเลนส์ ${getLensLabel(lens)}`);
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
      <div class="search-card-top">
        <span class="pill tone-explore">EXPLORE</span>
        <span class="pill soft">${getLensLabel((item.lenses || [])[1] || 'all')}</span>
      </div>
      <div class="search-thumb" style="background-image:url('${item.image}')">
        <span class="thumb-meta">${item.location || 'Nongkhai'}</span>
      </div>
      <h5>${item.title}</h5>
      <div class="search-meta-row">
        <small>${item.meta}</small>
        <small class="muted">${item.tag || item.time || ''}</small>
      </div>
      <p class="muted">${item.description || 'มุมไฮไลต์สำหรับแผนเที่ยววันนี้'}</p>
    `;
    card.addEventListener('click', () => openExploreDetail(item));
    wrap.appendChild(card);
  });
}

function renderSearchPlaceholder(text) {
  const wrap = document.getElementById('search-results');
  if (!wrap) return;
  wrap.innerHTML = `<div class="search-placeholder">${text}</div>`;
}

function bindSearchEvents() {
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const chips = document.querySelectorAll('#search-chips button');
  const lensButtons = document.querySelectorAll('#search-lens button');
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

  lensButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      lensButtons.forEach(b => b.classList.toggle('active', b === btn));
      state.searchLens = btn.dataset.lens || 'all';
      filterSearch(input.value || '');
      updateSearchStatus(`โหมด ${getLensLabel(state.searchLens)} • ปรับผลลัพธ์สด`);
    });
  });
}

function updateSearchCount(count, queryLabel) {
  const counter = document.getElementById('search-count');
  if (!counter) return;
  const label = queryLabel === 'search idle' ? 'ready' : count === 0 ? 'no match' : `${count} results`;
  counter.textContent = `${label} • ${queryLabel}`;
}

function updateSearchStatus(text) {
  const status = document.getElementById('search-status');
  const lens = document.getElementById('search-status-lens');
  const body = document.getElementById('search-status-body');
  if (!status || !lens || !body) return;
  lens.textContent = getLensLabel(state.searchLens);
  body.textContent = text;
}

function getLensLabel(key) {
  const map = {
    all: 'ทุกโหมด',
    river: 'ริมโขง',
    culture: 'วัฒนธรรม/ศิลป์',
    cafe: 'คาเฟ่',
    night: 'ค่ำคืน',
    dawn: 'เช้า/หมอก'
  };
  return map[key] || 'เมือง';
}

function scoreTimeMatch(timeRange) {
  if (!timeRange) return 0;
  const hour = new Date().getHours();
  const { start, end } = parseTimeRange(timeRange);
  return hour >= start && hour <= end ? 2 : 0;
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

async function init() {
  try {
    state.data = await loadData();
    buildSearchIndex(state.data);
    bindExploreDetailEvents();
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
