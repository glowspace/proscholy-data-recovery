import data from './data.json' with { type: 'json' };

const d = data as any;

// console.log(Object.keys(d));

// for (const song_lyric of d.song_lyrics) {
//     if (song_lyric.id <= 3323) {
//         continue;
//     }
// }

const uploaded_files = [];

for (const external of d.externals) {
    if (external.url.startsWith('https://zpevnik.proscholy.cz')) {
        uploaded_files.push(external);
    }
}

console.log(uploaded_files.length);