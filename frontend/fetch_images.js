const animes = [
  "Demon Slayer", "Spy x Family", "Kaiju No. 8", "Mashle", "Solo Leveling",
  "Dungeon Meshi", "One Piece", "My Hero Academia", "Jujutsu Kaisen",
  "Naruto Shippuden", "Black Clover", "Bleach"
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
