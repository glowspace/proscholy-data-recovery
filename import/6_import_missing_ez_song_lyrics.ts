import { db } from "../database_repository/db_instance";
import { import_song_lyric, type ImportSongLyric } from "../database_repository/song_lyric";
import { mobile_data } from "../mobile_data/mobile_data";
import { mobile_ez_data } from "../mobile_data/ez_data";
import { song_lyric_id__licence_type_cc } from "../evangelicky_zpevnik/license_index";

const mobileSongLyricIds = new Set(mobile_data.song_lyrics.map((songLyric) => Number(songLyric.id)));

const SONG_TYPE_ENUM__NUMBER = {
    ORIGINAL: 0,
    TRANSLATION: 1,
    AUTHORIZED_TRANSLATION: 2,
}

const songLyricsToImport: ImportSongLyric[] = mobile_ez_data.song_lyrics
	.filter((songLyric) => {
		const songLyricId = Number(songLyric.id);
		return Number.isInteger(songLyricId) && !mobileSongLyricIds.has(songLyricId);
	})
	.map((songLyric) => ({
		id: Number(songLyric.id),
		song_number: Number(songLyric.id),
		name: songLyric.name,
		secondary_name_1: songLyric.secondary_name_1,
		secondary_name_2: songLyric.secondary_name_2,
		licence_type_cc: song_lyric_id__licence_type_cc.get(Number(songLyric.id)),
		lyrics: songLyric.lyrics ?? "",
		hymnology: songLyric.hymnology ?? "",
		lang: songLyric.lang,
		type_enum: SONG_TYPE_ENUM__NUMBER[songLyric.type_enum as keyof typeof SONG_TYPE_ENUM__NUMBER] ?? 0,
		has_chords: songLyric.has_chords,
		song_id: songLyric.song?.id === undefined ? undefined : Number(songLyric.song.id),
		tag_ids: songLyric.tags
			.map((tag) => Number(tag.id))
			.filter((tagId) => Number.isInteger(tagId) && tagId > 0),
		externals: songLyric.externals
			.map((external) => ({
				id: Number(external.id),
				media_id: external.media_id ?? "",
				url: external.url,
				media_type: external.media_type ?? null,
				is_uploaded:
					external.url.startsWith("https://zpevnik.proscholy.cz") && external.media_id !== undefined,
			}))
			.filter((external) => Number.isInteger(external.id) && external.id > 0),
		author_ids: songLyric.authors_pivot
			.map(({ pivot }) => Number(pivot.author.id))
			.filter((authorId) => Number.isInteger(authorId) && authorId > 0),
	}));

const songLyricIdsToImport = songLyricsToImport.map((songLyric) => songLyric.id);

try {
	const existingSongLyrics = songLyricIdsToImport.length === 0
		? []
		: await db
			.selectFrom("song_lyrics")
			.select(["id", "name"])
			.where("id", "in", songLyricIdsToImport)
			.orderBy("id", "asc")
			.execute();

	const collisionIds = new Set(existingSongLyrics.map((row) => row.id));
	const songLyricsWithoutCollisions = songLyricsToImport.filter((songLyric) => !collisionIds.has(songLyric.id));

	for (const songLyric of songLyricsWithoutCollisions) {
		await import_song_lyric(songLyric, db);
	}

	console.log(
		JSON.stringify(
			{
				collision_detected: existingSongLyrics.length > 0,
				to_import_count: songLyricsToImport.length,
				collisions_count: existingSongLyrics.length,
				collisions: existingSongLyrics.map((row) => ({
					song_lyric_id: row.id,
					song_name: row.name,
				})),
				imported_count: songLyricsWithoutCollisions.length,
				note: "Imported only non-colliding songs and song_lyrics-related data using import_song_lyric;",
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
