import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "../utils";

export interface ImportExternal {
  id: number;
  media_id: string;
  url: string;
  media_type: string | null;
  is_uploaded: boolean;
}

export interface ImportSongLyric {
  id: number;
  song_number: number;
  name: string;
  secondary_name_1: string | undefined;
  secondary_name_2: string | undefined;
  licence_type_cc: number | undefined;
  lyrics: string;
  hymnology: string;
  lang: string;
  type_enum: number;
  has_chords: boolean;
  song_id: number | undefined;
  tag_ids: number[];
  externals: ImportExternal[];
  author_ids: number[];
}

export async function import_song_lyric(data: ImportSongLyric, db: Kysely<DB>) {
  const nowDates = dates();
  const secondary_name_1 = data.secondary_name_1 ?? null;
  const secondary_name_2 = data.secondary_name_2 ?? null;

  if (data.song_id !== undefined) {
    const song_exists = await db
      .selectFrom("songs")
      .select("id")
      .where("id", "=", data.song_id)
      .executeTakeFirst();

    if (!song_exists) {
      await db
        .insertInto("songs")
        .values({
          id: data.song_id,
          name: data.name,
          ...nowDates,
        })
        .execute();
    }
  }

  const song_lyric_exists = await db
    .selectFrom("song_lyrics")
    .select("id")
    .where("id", "=", data.id)
    .executeTakeFirst();

  const songLyricValues = {
    name: data.name,
    song_number: data.song_number,
    secondary_name_1,
    secondary_name_2,
    hymnology: data.hymnology,
    lang: data.lang,
    type: data.type_enum,
    has_chords: data.has_chords ? 1 : 0,
    song_id: data.song_id,
    licence_type_cc: data.licence_type_cc,
  };

  if (song_lyric_exists) {
    await db
      .updateTable("song_lyrics")
      .set({
        ...songLyricValues,
        updated_at: nowDates.updated_at,
      })
      .where("id", "=", data.id)
      .execute();
  } else {
    await db
      .insertInto("song_lyrics")
      .values({
        id: data.id,
        ...songLyricValues,
        ...nowDates,
      })
      .execute();
  }

  const lyricRowExists = await db
    .selectFrom("song_lyric_lyrics")
    .select("id")
    .where("song_lyric_id", "=", data.id)
    .executeTakeFirst();

  if (lyricRowExists) {
    await db
      .updateTable("song_lyric_lyrics")
      .set({
        lyrics: data.lyrics,
      })
      .where("song_lyric_id", "=", data.id)
      .execute();
  } else {
    await db
      .insertInto("song_lyric_lyrics")
      .values({
        song_lyric_id: data.id,
        lyrics: data.lyrics,
      })
      .execute();
  }

  for (const tag_id of data.tag_ids) {
    const taggableExists = await db
      .selectFrom("taggables")
      .select("tag_id")
      .where("taggable_type", "=", "App\\SongLyric")
      .where("taggable_id", "=", data.id)
      .where("tag_id", "=", tag_id)
      .executeTakeFirst();

    if (!taggableExists) {
      await db
        .insertInto("taggables")
        .values({
          taggable_type: "App\\SongLyric",
          taggable_id: data.id,
          tag_id,
        })
        .execute();
    }
  }

  for (const external of data.externals) {
    const externalExists = await db
      .selectFrom("externals")
      .select("id")
      .where("id", "=", external.id)
      .executeTakeFirst();

    if (externalExists) {
      await db
        .updateTable("externals")
        .set({
          song_lyric_id: data.id,
          url: external.url,
          media_type: external.media_type,
          updated_at: nowDates.updated_at,
          is_uploaded: external.is_uploaded ? 1 : 0,
        })
        .where("id", "=", external.id)
        .execute();
    } else {
      await db
        .insertInto("externals")
        .values({
          id: external.id,
          song_lyric_id: data.id,
          url: external.url,
          media_type: external.media_type,
          is_uploaded: external.is_uploaded ? 1 : 0,
          ...nowDates,
        })
        .execute();
    }
  }

  for (const author_id of data.author_ids) {
    const pivotExists = await db
      .selectFrom("author_song_lyric")
      .select("id")
      .where("author_id", "=", author_id)
      .where("song_lyric_id", "=", data.id)
      .executeTakeFirst();

    if (!pivotExists) {
      await db
        .insertInto("author_song_lyric")
        .values({
          author_id,
          song_lyric_id: data.id,
        })
        .execute();
    }
  }
}