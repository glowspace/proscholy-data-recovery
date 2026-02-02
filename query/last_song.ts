import data from '../data.json' with { type: 'json' };
const d = data as any;

console.log(d.song_lyrics.at(-1));