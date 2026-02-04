import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "../utils";

export interface ImportSongbookRecord {
    id: number;
    number: string;
    song_lyric_id: string;
    songbook_id: string;
}

export interface ImportSongbook {
    id: number;
    name: string;
    shortcut: string;
    color: string;
    color_text: string;
    is_private: boolean;
    records: ImportSongbookRecord[];
}

export async function import_songbook_with_records(songbook: ImportSongbook, db: Kysely<DB>) {
    const existing_songbook_ids = (await db
        .selectFrom('songbooks')
        .select(['id'])
        .where('id', '=', songbook.id)
        .execute()).map(row => row.id);

    if (!existing_songbook_ids.includes(songbook.id)) {
        await db.insertInto('songbooks').values({
            id: songbook.id,
            name: songbook.name,
            shortcut: songbook.shortcut,
            color: songbook.color,
            color_text: songbook.color_text,
            is_private: songbook.is_private ? 1 : 0,
            ...dates(),
        }).execute();
        console.log(`Songbook with ID ${songbook.id} inserted.`);
    } else {
        console.log(`Songbook with ID ${songbook.id} already exists, skipping insertion.`);
    }

    // Insert songbook records (but ignore all that are already present (same ID)).
    // 1. Get all songbook records IDs for this songbook.
    const existing_record_ids = (await db
        .selectFrom('songbook_records')
        .select(['id'])
        .where('songbook_id', '=', songbook.id)
        .execute()).map(row => row.id);
        
    const existing_record_ids_set = new Set(existing_record_ids);
    console.log(`Songbook ${songbook.id}: existing records: ${existing_record_ids_set.size}`);

    const new_records = songbook.records.filter(record => !existing_record_ids_set.has(record.id));
    console.log(`Songbook ${songbook.id}: new records: ${new_records.length}`);

    if (new_records.length === 0) {
        console.log(`Songbook ${songbook.id}: No new records to insert.`);
        return;
    }

    const existing_song_lyric_ids = await db.selectFrom('song_lyrics')
        .select(['id'])
        .where('id', 'in', new_records.map(record => Number(record.song_lyric_id)))
        .execute()
        .then(rows => rows.map(row => row.id));
    const existing_song_lyric_ids_set = new Set(existing_song_lyric_ids);

    const correct_records = new_records.filter(record => existing_song_lyric_ids_set.has(Number(record.song_lyric_id)));
    const skipped_song_lyric_ids = new_records
        .filter(record => !existing_song_lyric_ids_set.has(Number(record.song_lyric_id)))
        .map(record => record.song_lyric_id);

    if (skipped_song_lyric_ids.length > 0) {
        console.log(`Songbook ${songbook.id}: Skipped song_lyric IDs: ${skipped_song_lyric_ids.join(', ')}`);
    }

    if (correct_records.length === 0) {
        console.log(`Songbook ${songbook.id}: No correct records to insert after filtering.`);
        return;
    }

    await db.insertInto('songbook_records').values(
        correct_records.map(record => ({
            id: record.id,
            number: record.number,
            song_lyric_id: Number(record.song_lyric_id),
            songbook_id: Number(record.songbook_id),
            ...dates(),
        }))
    ).execute();
}