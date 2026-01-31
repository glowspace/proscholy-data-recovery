import data from './data.json' with { type: 'json' };

const d = data as any;

for (const song_lyric of d.song_lyrics) {
    if (song_lyric.id === 1000) {
        console.log(song_lyric.authors_pivot)
    }
}
// console.log(data.song_lyrics.at(-1));