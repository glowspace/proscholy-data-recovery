import { db } from "../database_repository/db_instance";
import { mobile_data } from "../mobile_data/mobile_data";
import { import_song_lyric, type ImportSongLyric } from "../database_repository/song_lyric";

const song_lyrics: ImportSongLyric[] = [];

const XML_FILE_TYPE = 'file/xml';

function media_type_to_string(media_type: number, url: string): string | null {
    if (url.endsWith('.xml')) {
        return XML_FILE_TYPE;
    }
    switch (media_type) {
        case 0: return 'spotify';
        case 1: return 'soundcloud';
        case 2: return 'youtube';
        case 3: return 'file/mp3';
        case 4: return 'file/pdf';
        case 5: return 'file/jpeg';
        default: return null;
    }
}
    

for (const song_lyric of mobile_data.song_lyrics) {
    const song_id = song_lyric.song?.id;
    if (song_id == null) {
        console.warn(`Song lyric with id ${song_lyric.id} has no associated song.`);
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
        song_id: song_id === undefined ? undefined : Number(song_id),
        author_ids: song_lyric.authors_pivot.map(({ pivot }) => pivot.author.id),
        externals: song_lyric.externals.map((external) => ({
            id: external.id,
            media_id: external.media_id ?? '',
            url: external.url,
            media_type: media_type_to_string(external.media_type, external.url),
            is_uploaded: external.url.startsWith('https://zpevnik.proscholy.cz') && external.media_id !== undefined,
        })),
        tag_ids: song_lyric.tags.map((tag) => tag.id),
    })
}

for (const song_lyric of song_lyrics) {
    await import_song_lyric(song_lyric, db);
}
console.log(`Imported ${song_lyrics.length} song lyrics.`);

await db.destroy();