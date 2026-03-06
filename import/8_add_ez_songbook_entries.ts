import { db } from "../database_repository/db_instance";
import { dates } from "../utils";
import { mobile_ez_data } from "../mobile_data/ez_data";

interface NormalizedSongbookRecord {
	record_id: number;
	number: string;
	song_lyric_id: number;
	songbook_id: number;
}

function chunkArray<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

const normalizedRecords: NormalizedSongbookRecord[] = [];
let skippedInvalidCount = 0;

for (const songLyric of mobile_ez_data.song_lyrics) {
	for (const record of songLyric.songbook_records) {
		const recordId = Number(record.pivot.id);
		const songLyricId = Number(record.pivot.song_lyric.id);
		const songbookId = Number(record.pivot.songbook.id);
        if (songbookId !== 58) {
            continue;
        }

		const number = (record.pivot.number ?? "").trim();

		const isValid =
			Number.isInteger(recordId) && recordId > 0 &&
			Number.isInteger(songLyricId) && songLyricId > 0 &&
			Number.isInteger(songbookId) && songbookId > 0 &&
			number.length > 0;

		if (!isValid) {
			skippedInvalidCount++;
            console.warn(`Skipping`, {
                recordId,
                songLyricId,
                songbookId,
                number
            })
			continue;
		}

		normalizedRecords.push({
			record_id: recordId,
			number,
			song_lyric_id: songLyricId,
			songbook_id: songbookId,
		});
	}
}

const dedupedById = new Map<number, NormalizedSongbookRecord>();
let duplicateInputRecordIdsCount = 0;
for (const record of normalizedRecords) {
	if (dedupedById.has(record.record_id)) {
		duplicateInputRecordIdsCount++;
		continue;
	}
	dedupedById.set(record.record_id, record);
}

const recordsToEnsure = Array.from(dedupedById.values());
const recordIdsToEnsure = recordsToEnsure.map((record) => record.record_id);

try {
	const existingRecordIds = new Set<number>();
	for (const idsChunk of chunkArray(recordIdsToEnsure, 1000)) {
		if (idsChunk.length === 0) continue;
		const rows = await db
			.selectFrom("songbook_records")
			.select("id")
			.where("id", "in", idsChunk)
			.execute();
		for (const row of rows) {
			existingRecordIds.add(row.id);
		}
	}

	const songLyricIds = Array.from(new Set(recordsToEnsure.map((record) => record.song_lyric_id)));
	const songbookIds = Array.from(new Set(recordsToEnsure.map((record) => record.songbook_id)));

	const existingSongLyricIds = new Set<number>();
	for (const idsChunk of chunkArray(songLyricIds, 1000)) {
		if (idsChunk.length === 0) continue;
		const rows = await db
			.selectFrom("song_lyrics")
			.select("id")
			.where("id", "in", idsChunk)
			.execute();
		for (const row of rows) {
			existingSongLyricIds.add(row.id);
		}
	}

	const existingSongbookIds = new Set<number>();
	for (const idsChunk of chunkArray(songbookIds, 1000)) {
		if (idsChunk.length === 0) continue;
		const rows = await db
			.selectFrom("songbooks")
			.select("id")
			.where("id", "in", idsChunk)
			.execute();
		for (const row of rows) {
			existingSongbookIds.add(row.id);
		}
	}

	let insertedCount = 0;
	let skippedExistingCount = 0;
	let skippedMissingFkCount = 0;

	for (const record of recordsToEnsure) {
		if (existingRecordIds.has(record.record_id)) {
			skippedExistingCount++;
			continue;
		}

		if (!existingSongLyricIds.has(record.song_lyric_id) || !existingSongbookIds.has(record.songbook_id)) {
			skippedMissingFkCount++;
			continue;
		}

        // console.log({
        //     type: 'insert',
        //     record_id: record.record_id,
        //     song_lyric_id: record.song_lyric_id,
        //     songbook_id: record.songbook_id,
        //     number: record.number,
        // });

		await db
			.insertInto("songbook_records")
			.values({
				id: record.record_id,
				number: record.number,
				song_lyric_id: record.song_lyric_id,
				songbook_id: record.songbook_id,
				...dates(),
			})
			.execute();

		insertedCount++;
	}

	console.log(
		JSON.stringify(
			{
				source_song_lyrics_count: mobile_ez_data.song_lyrics.length,
				source_songbook_records_count: normalizedRecords.length,
				to_ensure_count: recordsToEnsure.length,
				inserted_count: insertedCount,
				skipped_existing_count: skippedExistingCount,
				skipped_missing_fk_count: skippedMissingFkCount,
				skipped_invalid_count: skippedInvalidCount,
				duplicate_input_record_ids_count: duplicateInputRecordIdsCount,
			},
			null,
			2,
		),
	);
} catch (err) {
	console.error(err);
	process.exitCode = 1;
} finally {
	await db.destroy();
}
