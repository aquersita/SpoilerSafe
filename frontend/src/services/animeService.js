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

async function jikanSearch(type, query, page = 1, limit = 24) {
  const res = await fetch(`${JIKAN}/${type}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&sfw=false`);
  return res.json();
}

const MEDIA_FIELDS = `
  id title { romaji english native }
  coverImage { extraLarge large medium }
  bannerImage description status episodes
  season seasonYear averageScore genres format isAdult
  trailer { id }
  nextAiringEpisode { episode airingAt }
  streamingEpisodes { title thumbnail url site }
  externalLinks { site url }
  characters(sort: ROLE, perPage: 6) { nodes { name { full } image { large } } }
  studios(isMain: true) { nodes { name } }
`;

export const getAnime = (id) =>
  gql(`query($id:Int){Media(id:$id,type:ANIME){${MEDIA_FIELDS}}}`, { id: parseInt(id) });

export const searchAnime = async (search) => {
  const jikan = await jikanSearch('anime', search, 1, 10);
  const malIds = (jikan.data || []).map(a => a.mal_id).filter(Boolean);
  if (!malIds.length) return { data: { Page: { media: [] } } };
  return gql(
    `query($ids:[Int]){Page(perPage:10){media(idMal_in:$ids,type:ANIME){id title{romaji}coverImage{large}}}}`,
    { ids: malIds }
  );
};

export const getTrending = () =>
  gql(`{Page(perPage:20){media(sort:TRENDING_DESC,type:ANIME){id title{romaji}coverImage{extraLarge large}format}}}`);

export const getCatalog = async (page, sort, search) => {
  if (search) {
    const jikan = await jikanSearch('anime', search, page, 24);
    const malIds = (jikan.data || []).map(a => a.mal_id).filter(Boolean);
    const hasNextPage = jikan.pagination?.has_next_page || false;
    if (!malIds.length) return { data: { Page: { pageInfo: { hasNextPage: false }, media: [] } } };
    const anilist = await gql(
      `query($ids:[Int]){Page(perPage:24){media(idMal_in:$ids,type:ANIME){id title{romaji}coverImage{large}averageScore episodes status genres format isAdult}}}`,
      { ids: malIds }
    );
    return { data: { Page: { pageInfo: { hasNextPage }, media: anilist.data?.Page?.media || [] } } };
  }
  return gql(
    `query($p:Int,$s:[MediaSort]){Page(page:$p,perPage:24){pageInfo{hasNextPage}media(sort:$s,type:ANIME){id title{romaji}coverImage{large}averageScore episodes status genres format isAdult}}}`,
    { p: page, s: [sort] }
  );
};

export const searchUsers = null; // handled in userService
