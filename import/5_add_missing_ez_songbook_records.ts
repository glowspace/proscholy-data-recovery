import { db } from "../database_repository/db_instance";
import { dates } from "../utils";
import reportJson from "../query/check_missing_ez_song_lyrics_in_production.json" with { type: "json" };

interface FoundInDatabaseItem {
	song_lyric_id: number;
	song_name: string;
	ez_song_number: number | null;
	database_ez_song_number: number | null;
}

interface MissingReport {
	found_in_database: FoundInDatabaseItem[];
}

const EZ_SONGBOOK_ID = 58;

const report = reportJson as MissingReport;
const candidates = (report.found_in_database ?? []).filter(
	(row) => row.database_ez_song_number === null && row.ez_song_number !== null,
);

let insertedCount = 0;
let skippedExistingCount = 0;
let skippedInvalidCount = 0;

for (const row of candidates) {
	const songLyricId = Number(row.song_lyric_id);
	const ezSongNumber = row.ez_song_number === null ? null : Number(row.ez_song_number);

	if (!Number.isInteger(songLyricId) || !Number.isFinite(ezSongNumber)) {
		skippedInvalidCount++;
		continue;
	}

	const alreadyExists = await db
		.selectFrom("songbook_records")
		.select("id")
		.where("songbook_id", "=", EZ_SONGBOOK_ID)
		.where("song_lyric_id", "=", songLyricId)
		.executeTakeFirst();

	if (alreadyExists) {
		skippedExistingCount++;
		continue;
	}

	await db
		.insertInto("songbook_records")
		.values({
			songbook_id: EZ_SONGBOOK_ID,
			song_lyric_id: songLyricId,
			number: String(ezSongNumber),
			...dates(),
		})
		.execute();

	insertedCount++;
	console.log(`Inserted EZ record ${ezSongNumber} for song_lyric_id ${songLyricId} (${row.song_name}).`);
}

console.log(
	JSON.stringify(
		{
			ez_songbook_id: EZ_SONGBOOK_ID,
			candidates_count: candidates.length,
			inserted_count: insertedCount,
			skipped_existing_count: skippedExistingCount,
			skipped_invalid_count: skippedInvalidCount,
		},
		null,
		2,
	),
);

await db.destroy();
