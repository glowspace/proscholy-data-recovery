import { db } from "../database_repository/db_instance";

function parseSongLyricId(argv: string[]): number {
	const raw = argv[2];
	if (!raw) {
		throw new Error("Missing argument: song_lyric_id\nUsage: bun query/songbooks_of_song.ts <song_lyric_id>");
	}
	const id = Number(raw);
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error(`Invalid song_lyric_id: ${raw}`);
	}
	return id;
}

const songLyricId = parseSongLyricId(process.argv);

try {
	const songLyric = await db
		.selectFrom("song_lyrics")
		.select(["id", "name"])
		.where("id", "=", songLyricId)
		.executeTakeFirst();

	const records = await db
		.selectFrom("songbook_records as r")
		.innerJoin("songbooks as s", "s.id", "r.songbook_id")
		.select([
			"r.id as record_id",
			"r.songbook_id",
			"s.name as songbook_name",
			"s.shortcut as songbook_shortcut",
			"s.is_private as songbook_is_private",
			"r.number as record_number",
			"r.placeholder as record_placeholder",
			"r.song_name as record_song_name",
		])
		.where("r.song_lyric_id", "=", songLyricId)
		.orderBy("s.name", "asc")
		.orderBy("r.number", "asc")
		.orderBy("r.id", "asc")
		.execute();

	const output = {
		song_lyric: songLyric ?? { id: songLyricId, name: null },
		songbook_records: records,
	};

	console.log(JSON.stringify(output, null, 2));
} catch (err) {
	console.error(err);
	process.exitCode = 1;
} finally {
	await db.destroy();
}

