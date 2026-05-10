const ANILIST = 'https://graphql.anilist.co';

async function gql(query, variables = {}) {
  const res = await fetch(ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
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

export const searchAnime = (search) =>
  gql(`query($s:String){Page(perPage:10){media(search:$s,type:ANIME,sort:SEARCH_MATCH){id title{romaji}coverImage{large}}}}`, { s: search });

export const getTrending = () =>
  gql(`{Page(perPage:20){media(sort:TRENDING_DESC,type:ANIME){id title{romaji}coverImage{extraLarge large}format}}}`);

export const getCatalog = (page, sort, search) => {
  if (search) {
    return gql(
      `query($p:Int,$s:[MediaSort],$q:String){Page(page:$p,perPage:24){pageInfo{hasNextPage}media(search:$q,sort:$s,type:ANIME){id title{romaji}coverImage{large}averageScore episodes status genres format isAdult}}}`,
      { p: page, s: ['SEARCH_MATCH'], q: search }
    );
  }
  return gql(
    `query($p:Int,$s:[MediaSort]){Page(page:$p,perPage:24){pageInfo{hasNextPage}media(sort:$s,type:ANIME){id title{romaji}coverImage{large}averageScore episodes status genres format isAdult}}}`,
    { p: page, s: [sort] }
  );
};

export const searchUsers = null; // handled in userService
