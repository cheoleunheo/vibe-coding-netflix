const API_KEY = 'ae0b4846ca28b1149c5e90b7ad35d679';
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const IMAGE_SIZE = 'w780';

const endpoints = {
  genres: `${API_BASE}/genre/movie/list?api_key=${API_KEY}&language=ko-KR`,
  nowPlaying: `${API_BASE}/movie/now_playing?api_key=${API_KEY}&language=ko-KR&region=KR&page=1`,
  popular: `${API_BASE}/movie/popular?api_key=${API_KEY}&language=ko-KR&region=KR&page=1`
};

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
    const [genreRes, nowRes, popRes] = await Promise.all([
      fetchJson(endpoints.genres),
      fetchJson(endpoints.nowPlaying),
      fetchJson(endpoints.popular)
    ]);

    const genreMap = createGenreLookup(genreRes.genres || []);
    renderRow('row-now-playing', (nowRes.results || []).slice(0, 20), genreMap);
    renderRow('row-popular', (popRes.results || []).slice(0, 20), genreMap);
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


