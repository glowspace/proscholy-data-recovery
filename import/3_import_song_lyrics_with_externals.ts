import { db } from "../db_instance";
import { mobile_data } from "../mobile_data/mobile_data";
import { import_song_lyric, type ImportSongLyric } from "../song_lyric";

const song_lyrics: ImportSongLyric[] = [];

for (const song_lyric of mobile_data.song_lyrics) {
    const song_id = song_lyric.song?.id;
    if (song_id == null) {
        console.warn(`Song lyric with id ${song_lyric.id} has no associated song, skipping...`);
        continue;
    }
    song_lyrics.push({
        id: song_lyric.id,
        name: song_lyric.name,
        secondary_name_1: song_lyric.secondary_name_1,
        secondary_name_2: song_lyric.secondary_name_2,
        lyrics: song_lyric.lyrics ?? '',
        hymnology: song_lyric.hymnology,
        lang: song_lyric.lang,
        type_enum: song_lyric.type_enum,
        has_chords: song_lyric.has_chords,
        song_id: Number(song_id),
        author_ids: song_lyric.authors_pivot.map(({ pivot }) => pivot.author.id),
        externals: song_lyric.externals.map((external) => ({
            id: external.id,
            media_id: external.media_id ?? '',
            url: external.url,
            media_type: external.media_type,
        })),
        tag_ids: song_lyric.tags.map((tag) => tag.id),
    })
}

for (const song_lyric of song_lyrics) {
    await import_song_lyric(song_lyric, db);
}
console.log(`Imported ${song_lyrics.length} song lyrics.`);

await db.destroy();