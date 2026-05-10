const ANILIST = 'https://graphql.anilist.co';
const JIKAN = 'https://api.jikan.moe/v4';

async function gql(query, variables = {}) {
  const res = await fetch(ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const MANGA_FIELDS = `
  id idMal title { romaji english }
  coverImage { extraLarge large }
  bannerImage description status chapters volumes
  season seasonYear averageScore genres format isAdult
  startDate { year month day }
  externalLinks { site url }
  staff(perPage: 4) { nodes { name { full } primaryOccupations } }
`;

export async function getMangaChaptersFromJikan(malId) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${JIKAN}/manga/${malId}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.chapters || null;
  } catch {
    return null;
  }
}

export const getManga = (id) =>
  gql(`query($id:Int){Media(id:$id,type:MANGA){${MANGA_FIELDS}}}`, { id: parseInt(id) });

export const searchManga = async (search) => {
  const res = await fetch(`${JIKAN}/manga?q=${encodeURIComponent(search)}&limit=20&sfw=false`);
  const text = await res.text();
  let jikan;
  try {
    jikan = JSON.parse(text);
  } catch {
    jikan = JSON.parse(text.replace(/[\x00-\x1F\x7F]/g, ' '));
  }
  const malIds = (jikan.data || []).map(m => m.mal_id).filter(Boolean);
  if (!malIds.length) return { data: { Page: { media: [] } } };
  return gql(
    `query($ids:[Int]){Page(perPage:20){media(idMal_in:$ids,type:MANGA){id title{romaji}coverImage{large}averageScore chapters status genres}}}`,
    { ids: malIds }
  );
};

export const getTrendingManga = () =>
  gql(`{Page(perPage:20){media(sort:TRENDING_DESC,type:MANGA){id title{romaji}coverImage{large}averageScore chapters status genres}}}`);

export const getPopularManga = () =>
  gql(`{Page(perPage:20){media(sort:POPULARITY_DESC,type:MANGA){id title{romaji}coverImage{large}averageScore chapters status genres}}}`);
