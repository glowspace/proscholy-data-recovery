import { import_authors, type Author } from "../authors";
import { db } from "../db_instance";
import { mobile_data } from "../mobile_data/mobile_data";
import { import_songbook_with_records, type Songbook } from "../songbook";

const songbooks: Songbook[] = [];

for (const songbook of mobile_data.songbooks) {
    songbooks.push({
        id: songbook.id,
        name: songbook.name,
        shortcut: songbook.shortcut,
        color: songbook.color,
        color_text: songbook.color_text,
        is_private: songbook.is_private,
        records: songbook.records.map((record: any) => ({
            id: record.id,
            number: record.number,
            song_lyric_id: record.song_lyric.id,
            songbook_id: record.songbook.id, 
        }))
    });
}

for (const songbook of songbooks) {
    await import_songbook_with_records(songbook, db);
}

await db.destroy();
