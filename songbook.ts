import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "./utils";

export interface SongbookRecord {
    id: number;
    number: string;
    song_lyric_id: string;
    songbook_id: string;
}

export interface Songbook {
    id: number;
    name: string;
    shortcut: string;
    color: string;
    color_text: string;
    is_private: boolean;
    records: SongbookRecord[];
}

export async function import_songbook_with_records(songbook: Songbook, db: Kysely<DB>) {
    await db.insertInto('songbooks').values({
        id: songbook.id,
        name: songbook.name,
        shortcut: songbook.shortcut,
        color: songbook.color,
        color_text: songbook.color_text,
        is_private: songbook.is_private ? 1 : 0,
        ...dates(),
    }).onConflict(oc => oc.column('id').doNothing()).execute();

    const inserted_songbook_records = await db.insertInto('songbook_records').values(
        songbook.records.map(record => ({
            number: record.number,
            song_lyric_id: Number(record.song_lyric_id),
            songbook_id: Number(record.songbook_id),
        }))
    ).execute();

    console.log(`Imported songbook ${songbook.name} with ${inserted_songbook_records.length} updated rows.`);
}