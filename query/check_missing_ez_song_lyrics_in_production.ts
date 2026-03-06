import { db } from "../database_repository/db_instance";
import missingReport from "./missing_ez_song_lyrics_in_mobile.json" with { type: "json" };

interface MissingReportItem {
	song_lyric_id: number;
	song_name: string;
	ez_song_number: number;
}

interface MissingReport {
	missing_in_mobile: MissingReportItem[];
}

const report = missingReport as MissingReport;
const reportRows = report.missing_in_mobile ?? [];

const missingIds = reportRows
	.map((row) => Number(row.song_lyric_id))
	.filter((id) => Number.isInteger(id) && id > 0);

const reportById = new Map<number, MissingReportItem>();
for (const row of reportRows) {
	const id = Number(row.song_lyric_id);
	if (Number.isInteger(id) && id > 0 && !reportById.has(id)) {
		reportById.set(id, row);
	}
}

try {
	let foundInDatabase: {
		song_lyric_id: number;
		song_name: string;
		ez_song_number: number | null;
		database_ez_song_number: number | null;
	}[] = [];

	if (missingIds.length > 0) {
		const existingRows = await db
			.selectFrom("song_lyrics")
			.select(["id", "name"])
			.where("id", "in", missingIds)
			.orderBy("id", "asc")
			.execute();

		const existingIds = existingRows.map((row) => row.id);
		const databaseEzRows = await db
			.selectFrom("songbook_records as r")
			.innerJoin("songbooks as s", "s.id", "r.songbook_id")
			.select(["r.song_lyric_id", "r.number as ez_songbook_number"])
			.where("s.shortcut", "=", "EZ")
			.where("r.song_lyric_id", "in", existingIds)
			.execute();

		const dbEzNumberBySongLyricId = new Map<number, number>();
		for (const row of databaseEzRows) {
			if (row.song_lyric_id === null || row.ez_songbook_number === null) {
				continue;
			}

			const songLyricId = Number(row.song_lyric_id);
			const ezNumber = Number(row.ez_songbook_number);
			if (!Number.isInteger(songLyricId) || !Number.isFinite(ezNumber)) {
				continue;
			}

			if (!dbEzNumberBySongLyricId.has(songLyricId)) {
				dbEzNumberBySongLyricId.set(songLyricId, ezNumber);
			}
		}

		foundInDatabase = existingRows.map((row) => {
			const source = reportById.get(row.id);
			return {
				song_lyric_id: row.id,
				song_name: row.name,
				ez_song_number: source?.ez_song_number ?? null,
				database_ez_song_number: dbEzNumberBySongLyricId.get(row.id) ?? null,
			};
		});
	}

	console.log(
		JSON.stringify(
			{
				checked_ids_count: missingIds.length,
				all_missing_in_database: foundInDatabase.length === 0,
				found_in_database_count: foundInDatabase.length,
				found_in_database: foundInDatabase,
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
