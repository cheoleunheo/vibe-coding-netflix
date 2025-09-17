const API_KEY = 'ae0b4846ca28b1149c5e90b7ad35d679';
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const IMAGE_SIZE = 'w780';

function getLocale() {
  const saved = localStorage.getItem('tmdb_locale');
  if (saved) return saved.split('|');
  return ['ko-KR', 'KR'];
}

function buildEndpoints(language, region) {
  return {
    genres: `${API_BASE}/genre/movie/list?api_key=${API_KEY}&language=${language}`,
    nowPlaying: `${API_BASE}/movie/now_playing?api_key=${API_KEY}&language=${language}&region=${region}&page=1`,
    popular: `${API_BASE}/movie/popular?api_key=${API_KEY}&language=${language}&region=${region}&page=1`,
    upcoming: `${API_BASE}/movie/upcoming?api_key=${API_KEY}&language=${language}&region=${region}&page=1`
  };
}

let endpoints = buildEndpoints(...getLocale());

// Simple i18n strings
const I18N = {
  'ko-KR': {
    navNow: '상영중',
    navPopular: '인기',
    navUpcoming: '개봉예정',
    titleNow: '상영 중인 영화',
    titlePopular: '인기 있는 영화',
    titleUpcoming: '개봉 예정 영화',
    releasedOn: '개봉일'
  },
  'en-US': {
    navNow: 'Now Playing',
    navPopular: 'Popular',
    navUpcoming: 'Upcoming',
    titleNow: 'Now Playing',
    titlePopular: 'Popular Movies',
    titleUpcoming: 'Upcoming Movies',
    releasedOn: 'Release Date'
  },
  'ja-JP': {
    navNow: '上映中',
    navPopular: '人気',
    navUpcoming: '公開予定',
    titleNow: '上映中の映画',
    titlePopular: '人気の映画',
    titleUpcoming: '公開予定の映画',
    releasedOn: '公開日'
  },
  'es-ES': {
    navNow: 'En cartelera',
    navPopular: 'Populares',
    navUpcoming: 'Próximos',
    titleNow: 'En cartelera',
    titlePopular: 'Películas populares',
    titleUpcoming: 'Próximos estrenos',
    releasedOn: 'Fecha de estreno'
  },
  'zh-CN': {
    navNow: '正在热映',
    navPopular: '热门',
    navUpcoming: '即将上映',
    titleNow: '正在热映的电影',
    titlePopular: '热门电影',
    titleUpcoming: '即将上映的电影',
    releasedOn: '上映日期'
  },
  'ar-SA': {
    navNow: 'يعرض الآن',
    navPopular: 'شائع',
    navUpcoming: 'قريباً',
    titleNow: 'أفلام تُعرض الآن',
    titlePopular: 'أفلام شائعة',
    titleUpcoming: 'أفلام قادمة',
    releasedOn: 'تاريخ الإصدار'
  },
  'fr-FR': {
    navNow: 'En salle',
    navPopular: 'Populaire',
    navUpcoming: 'À venir',
    titleNow: 'En salle',
    titlePopular: 'Films populaires',
    titleUpcoming: 'Films à venir',
    releasedOn: 'Date de sortie'
  }
};

function applyI18n(language) {
  const dict = I18N[language] || I18N['en-US'];
  const q = (id) => document.getElementById(id);
  const navNow = q('nav-now');
  const navPopular = q('nav-popular');
  const navUpcoming = q('nav-upcoming');
  const titleNow = q('title-now');
  const titlePopular = q('title-popular');
  const titleUpcoming = q('title-upcoming');
  if (navNow) navNow.textContent = dict.navNow;
  if (navPopular) navPopular.textContent = dict.navPopular;
  if (navUpcoming) navUpcoming.textContent = dict.navUpcoming;
  if (titleNow) titleNow.textContent = dict.titleNow;
  if (titlePopular) titlePopular.textContent = dict.titlePopular;
  if (titleUpcoming) titleUpcoming.textContent = dict.titleUpcoming;
}

/**
 * Fetch JSON helper with basic error handling
 */
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function createGenreLookup(genreList) {
  const map = new Map();
  genreList.forEach(g => map.set(g.id, g.name));
  return map;
}

function getGenreNames(genreIds, genreMap) {
  return genreIds.map(id => genreMap.get(id)).filter(Boolean);
}

function buildCard(movie, genreMap) {
  const tpl = document.getElementById('card-template');
  const node = tpl.content.firstElementChild.cloneNode(true);

  const img = node.querySelector('.card__poster');
  const title = node.querySelector('.card__title');
  const date = node.querySelector('.card__date');
  const genres = node.querySelector('.card__genres');

  const backdropPath = movie.backdrop_path ? `${IMAGE_BASE}${IMAGE_SIZE}${movie.backdrop_path}` : '';
  const posterPath = movie.poster_path ? `${IMAGE_BASE}w342${movie.poster_path}` : '';

  const chosen = backdropPath || posterPath;
  if (chosen) {
    img.src = chosen;
    img.alt = `${movie.title} 포스터`;
  } else {
    img.alt = `${movie.title} 포스터 없음`;
  }

  title.textContent = movie.title;
  const [language] = getLocale();
  if (movie.release_date) {
    try {
      const d = new Date(movie.release_date);
      const formatted = d.toLocaleDateString(language, { year: 'numeric', month: '2-digit', day: '2-digit' });
      const dict = I18N[language] || I18N['en-US'];
      date.textContent = `${dict.releasedOn}: ${formatted}`;
    } catch (_) {
      const dict = I18N[language] || I18N['en-US'];
      date.textContent = `${dict.releasedOn}: ${movie.release_date}`;
    }
  } else {
    date.textContent = '';
  }
  const names = getGenreNames(movie.genre_ids || [], genreMap);
  genres.textContent = names.join(' · ');

  return node;
}

function renderRow(containerId, movies, genreMap) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  movies.forEach(m => fragment.appendChild(buildCard(m, genreMap)));
  container.appendChild(fragment);
}

async function init() {
  try {
    const [genreRes, nowRes, popRes, upRes] = await Promise.all([
      fetchJson(endpoints.genres),
      fetchJson(endpoints.nowPlaying),
      fetchJson(endpoints.popular),
      fetchJson(endpoints.upcoming)
    ]);

    const genreMap = createGenreLookup(genreRes.genres || []);
    renderRow('row-now-playing', (nowRes.results || []).slice(0, 20), genreMap);
    renderRow('row-popular', (popRes.results || []).slice(0, 20), genreMap);
    renderRow('row-upcoming', (upRes.results || []).slice(0, 20), genreMap);
  } catch (err) {
    console.error(err);
    alert('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
}

document.addEventListener('DOMContentLoaded', init);

// Simple nav buttons scroll
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav__link');
  if (!btn) return;
  const id = btn.getAttribute('data-section');
  const section = document.getElementById(id);
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Language selector
document.addEventListener('change', (e) => {
  const select = e.target.closest('#language-select');
  if (!select) return;
  const [language, region] = select.value.split('|');
  localStorage.setItem('tmdb_locale', `${language}|${region}`);
  endpoints = buildEndpoints(language, region);
  applyI18n(language);
  init();
});

// Initialize selector value from storage
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('language-select');
  if (!select) return;
  const [language, region] = getLocale();
  select.value = `${language}|${region}`;
  applyI18n(language);
});


