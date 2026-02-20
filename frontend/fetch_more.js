const animes = [
  "Attack on Titan", "Hunter x Hunter", "Death Note", "Fullmetal Alchemist", "Dragon Ball Z",
  "Chainsaw Man", "Tokyo Ghoul"
];

async function fetchImages() {
  for (const name of animes) {
    const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const anime = data.data[0];
      const poster = anime.attributes.posterImage?.large || anime.attributes.posterImage?.original;
      const cover = anime.attributes.coverImage?.large || anime.attributes.coverImage?.original;
      console.log(`[${name}] Poster: ${poster}`);
      console.log(`[${name}] Cover: ${cover}`);
    }
  }
}

fetchImages();
