const ANILIST = 'https://graphql.anilist.co';

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

export const searchManga = (search) =>
  gql(`query($s:String){Page(perPage:20){media(search:$s,type:MANGA,sort:SEARCH_MATCH){id title{romaji}coverImage{large}averageScore chapters status genres}}}`, { s: search });

export const getTrendingManga = () =>
  gql(`{Page(perPage:20){media(sort:TRENDING_DESC,type:MANGA){id title{romaji}coverImage{large}averageScore chapters status genres}}}`);

export const getPopularManga = () =>
  gql(`{Page(perPage:20){media(sort:POPULARITY_DESC,type:MANGA){id title{romaji}coverImage{large}averageScore chapters status genres}}}`);
