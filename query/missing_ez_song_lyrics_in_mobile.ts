import { mobile_data } from "../mobile_data/mobile_data";
import { mobile_ez_data } from "../mobile_data/ez_data";

const mobileSongLyricIds = new Set(mobile_data.song_lyrics.map((songLyric) => String(songLyric.id)));

const missingEzSongLyrics = mobile_ez_data.song_lyrics
	.filter((songLyric) => !mobileSongLyricIds.has(String(songLyric.id)))
	.map((songLyric) => {
		const ezSongNumbers = Array.from(
			new Set(
				songLyric.songbook_records
                    .filter((record) => record.pivot.songbook.id === '58')
					.map((record) => record.pivot.number)
					.filter((number) => number.length > 0)
			),
		).sort((a, b) => Number(a) - Number(b));

		return {
			song_lyric_id: Number(songLyric.id),
			song_name: songLyric.name,
			ez_song_number: Number(ezSongNumbers[0]),
		};
	})
	.sort((a, b) => {
		const aFirstNumber = Number(a.ez_song_number ?? a.song_lyric_id);
		const bFirstNumber = Number(b.ez_song_number ?? b.song_lyric_id);
		if (aFirstNumber !== bFirstNumber) {
			return aFirstNumber - bFirstNumber;
		}
		return a.song_lyric_id - b.song_lyric_id;
	});

console.log(
	JSON.stringify(
		{
			ez_song_lyrics_total: mobile_ez_data.song_lyrics.length,
			mobile_song_lyrics_total: mobile_data.song_lyrics.length,
			missing_in_mobile_count: missingEzSongLyrics.length,
			missing_in_mobile: missingEzSongLyrics,
		},
		null,
		2,
	),
);
