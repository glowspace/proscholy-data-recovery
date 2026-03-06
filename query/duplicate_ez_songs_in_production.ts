import { db } from "../database_repository/db_instance";
import { mobile_data } from "../mobile_data/mobile_data";

try {
	const mobileEzSongbooks = mobile_data.songbooks.filter(
		(songbook) => songbook.shortcut.toUpperCase() === "EZ",
	);

	const mobileEzSongNumbers = new Set<number>();
	for (const songbook of mobileEzSongbooks) {
		for (const record of songbook.records) {
			const number = Number(record.number);
			if (Number.isFinite(number)) {
				mobileEzSongNumbers.add(number);
			}
		}
	}

	const dbRows = await db
		.selectFrom("songbook_records as r")
		.innerJoin("songbooks as s", "s.id", "r.songbook_id")
		.innerJoin("song_lyrics as l", "l.id", "r.song_lyric_id")
		.select([
			"l.id as song_lyric_id",
			"l.name as song_name",
			"r.number as ez_songbook_number",
			's.id as songbook_id',
		])
		.where("s.shortcut", "=", "EZ")
		.execute();

	const dbEzSongs = dbRows
		.map((row) => ({
			...row,
			ez_songbook_number_numeric: Number(row.ez_songbook_number),
		}))
		.filter((row) => Number.isFinite(row.ez_songbook_number_numeric))
		.sort((a, b) => {
			if (a.ez_songbook_number_numeric !== b.ez_songbook_number_numeric) {
				return a.ez_songbook_number_numeric - b.ez_songbook_number_numeric;
			}
			return a.song_lyric_id - b.song_lyric_id;
		});

	const missingInMobile = dbEzSongs
		.filter((row) => !mobileEzSongNumbers.has(row.ez_songbook_number_numeric))
		.map(({ ez_songbook_number_numeric: _ignored, ...row }) => row);

	console.log(
		JSON.stringify(
			{
				mobile_ez_songbook_shortcuts_found: mobileEzSongbooks.length,
				mobile_ez_song_numbers_count: mobileEzSongNumbers.size,
				database_missing_in_mobile: missingInMobile,
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

