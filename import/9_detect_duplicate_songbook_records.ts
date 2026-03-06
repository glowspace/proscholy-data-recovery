import { db } from "../database_repository/db_instance";

interface SongbookRecordRow {
	id: number;
	song_lyric_id: number | null;
	number: string | null;
	songbook_id: number;
}

interface DuplicateGroup {
	songbook_id: number;
	song_lyric_id: number | null;
	number: string | null;
	kept_id: number;
	removed_ids: number[];
}

function makeGroupKey(row: SongbookRecordRow): string {
	return JSON.stringify({
		songbook_id: row.songbook_id,
		song_lyric_id: row.song_lyric_id,
		number: row.number,
	});
}

function chunkArray<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

try {
	const rows = await db
		.selectFrom("songbook_records")
		.select(["id", "song_lyric_id", "number", "songbook_id"])
		.orderBy("songbook_id", "asc")
		.orderBy("song_lyric_id", "asc")
		.orderBy("number", "asc")
		.orderBy("id", "asc")
		.execute();

	const firstByKey = new Map<string, SongbookRecordRow>();
	const groupsByKey = new Map<string, DuplicateGroup>();
	const idsToDelete: number[] = [];

	for (const row of rows) {
		const key = makeGroupKey(row);
		const existing = firstByKey.get(key);

		if (!existing) {
			firstByKey.set(key, row);
			continue;
		}

        console.log({
            type: 'duplicate_found',
            existing_id: existing.id,
            duplicate_id: row.id,
            songbook_id: row.songbook_id,
            song_lyric_id: row.song_lyric_id,
            number: row.number,
        })

		idsToDelete.push(row.id);

		if (!groupsByKey.has(key)) {
			groupsByKey.set(key, {
				songbook_id: row.songbook_id,
				song_lyric_id: row.song_lyric_id,
				number: row.number,
				kept_id: existing.id,
				removed_ids: [],
			});
		}

		groupsByKey.get(key)!.removed_ids.push(row.id);
	}

	for (const idsChunk of chunkArray(idsToDelete, 1000)) {
		if (idsChunk.length === 0) {
			continue;
		}

		await db
			.deleteFrom("songbook_records")
			.where("id", "in", idsChunk)
			.execute();
	}

	const duplicateGroups = Array.from(groupsByKey.values()).sort((a, b) => {
		if (a.songbook_id !== b.songbook_id) {
			return a.songbook_id - b.songbook_id;
		}
		if ((a.song_lyric_id ?? -1) !== (b.song_lyric_id ?? -1)) {
			return (a.song_lyric_id ?? -1) - (b.song_lyric_id ?? -1);
		}
		return (a.number ?? "").localeCompare(b.number ?? "");
	});

	console.log(
		JSON.stringify(
			{
				total_records_scanned: rows.length,
				duplicate_groups_count: duplicateGroups.length,
				removed_records_count: idsToDelete.length,
				duplicate_groups: duplicateGroups,
				note: "For each duplicate key (song_lyric_id, number, songbook_id), the smallest id was kept and bigger ids were removed.",
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
