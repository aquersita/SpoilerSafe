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
  id title { romaji english }
  coverImage { extraLarge large }
  bannerImage description status chapters volumes
  season seasonYear averageScore genres format isAdult
  startDate { year month day }
  externalLinks { site url }
  staff(perPage: 4) { nodes { name { full } primaryOccupations } }
`;

export const getManga = (id) =>
  gql(`query($id:Int){Media(id:$id,type:MANGA){${MANGA_FIELDS}}}`, { id: parseInt(id) });

export const searchManga = async (search) => {
  const res = await fetch(`${JIKAN}/manga?q=${encodeURIComponent(search)}&limit=20&sfw=false`);
  const jikan = await res.json();
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
