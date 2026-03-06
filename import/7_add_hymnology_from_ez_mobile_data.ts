import { db } from "../database_repository/db_instance";
import { mobile_ez_data } from "../mobile_data/ez_data";

function isMissingText(value: string | null | undefined): boolean {
	return value === null || value === undefined || value.trim().length === 0;
}

const ezHymnologyBySongLyricId = new Map<number, string>();

for (const songLyric of mobile_ez_data.song_lyrics) {
	const songLyricId = Number(songLyric.id);
	if (!Number.isInteger(songLyricId) || songLyricId <= 0) {
		continue;
	}

	ezHymnologyBySongLyricId.set(songLyricId, songLyric.hymnology ?? "");
}

const songLyricIds = Array.from(ezHymnologyBySongLyricId.keys());

try {
	if (songLyricIds.length === 0) {
		console.log(
			JSON.stringify(
				{
					ez_song_lyrics_with_ids: 0,
					checked_in_database_count: 0,
					updated_hymnology_count: 0,
					differences_count: 0,
					differences: [],
					note: "No EZ song lyric IDs found.",
				},
				null,
				2,
			),
		);
	} else {
		const dbSongLyrics = await db
			.selectFrom("song_lyrics")
			.select(["id", "hymnology"])
			.where("id", "in", songLyricIds)
			.orderBy("id", "asc")
			.execute();

		const differences: {
			song_lyric_id: number;
				database_hymnology: string;
				ez_hymnology: string;
		}[] = [];

		let updatedHymnologyCount = 0;

		for (const dbSongLyric of dbSongLyrics) {
			const ezHymnology = ezHymnologyBySongLyricId.get(dbSongLyric.id) ?? "";
			const databaseHymnology = dbSongLyric.hymnology;

			const dbMissing = isMissingText(databaseHymnology);
			const ezMissing = isMissingText(ezHymnology);

			if (dbMissing && !ezMissing) {
				await db
					.updateTable("song_lyrics")
					.set({
						hymnology: ezHymnology,
						updated_at: new Date(),
					})
					.where("id", "=", dbSongLyric.id)
					.execute();

				updatedHymnologyCount++;
				continue;
			}

			if (!dbMissing && !ezMissing && databaseHymnology.trim() !== ezHymnology.trim()) {
				differences.push({
					song_lyric_id: dbSongLyric.id,
					database_hymnology: databaseHymnology,
					ez_hymnology: ezHymnology,
				});
			}
		}

		console.log(
			JSON.stringify(
				{
					ez_song_lyrics_with_ids: songLyricIds.length,
					checked_in_database_count: dbSongLyrics.length,
					updated_hymnology_count: updatedHymnologyCount,
					differences_count: differences.length,
					differences,
					note: "Updated only DB rows with missing hymnology and logged rows where both DB and EZ hymnology are present but differ.",
				},
				null,
				2,
			),
		);
	}
} catch (err) {
	console.error(err);
	process.exitCode = 1;
} finally {
	await db.destroy();
}
