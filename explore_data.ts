import data from './data.json' with { type: 'json' };

const d = data as any;

console.log(Object.keys(d));


// for (const song_lyric of d.song_lyrics) {
//     if (song_lyric.id <= 3323) {
//         continue;
//     }
// }