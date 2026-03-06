import { db } from "../database_repository/db_instance";

try {
	const ezRows = await db
		.selectFrom("songbook_records as r")
		.innerJoin("songbooks as s", "s.id", "r.songbook_id")
		.select(["r.number as ez_songbook_number", "r.song_lyric_id"])
		.where("s.shortcut", "=", "EZ")
		.execute();

	const songs = ezRows
		.map((row) => ({
			ez_songbook_number_numeric: Number(row.ez_songbook_number),
			song_lyric_id_numeric: Number(row.song_lyric_id),
		}))
		.filter(
			(row) =>
				Number.isFinite(row.ez_songbook_number_numeric) &&
				Number.isInteger(row.song_lyric_id_numeric) &&
				row.song_lyric_id_numeric > 0,
		)
		.sort((a, b) => {
			if (a.ez_songbook_number_numeric !== b.ez_songbook_number_numeric) {
				return a.ez_songbook_number_numeric - b.ez_songbook_number_numeric;
			}
			return a.song_lyric_id_numeric - b.song_lyric_id_numeric;
		})
		.map(({ ez_songbook_number_numeric, song_lyric_id_numeric }) => ({
			ez_songbook_number: ez_songbook_number_numeric,
			song_lyric_id: song_lyric_id_numeric,
		}));

	const rowsByEzNumber = new Map<number, typeof songs>();
	for (const row of songs) {
		const number = row.ez_songbook_number;
		if (!rowsByEzNumber.has(number)) {
			rowsByEzNumber.set(number, []);
		}
		rowsByEzNumber.get(number)!.push(row);
	}

	const duplicateEzSongNumbers = Array.from(rowsByEzNumber.entries())
		.filter(([, rows]) => rows.length > 1)
		.sort((a, b) => a[0] - b[0])
		.map(([ezSongbookNumber, rows]) => ({
			ez_songbook_number: ezSongbookNumber,
			song_lyric_ids: rows.map((row) => row.song_lyric_id),
		}));

	console.log(
		JSON.stringify(
			duplicateEzSongNumbers,
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
