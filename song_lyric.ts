import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "./utils";

export interface ImportExternal {
  id: number;
  media_id: string;
  url: string;
  media_type: number;
}

export interface ImportSongLyric {
  id: number;
  name: string;
  secondary_name_1: string | undefined;
  secondary_name_2: string | undefined;
  lyrics: string;
  hymnology: string;
  lang: string;
  type_enum: number;
  has_chords: boolean;
  song_id: number;
  tag_ids: number[];
  externals: ImportExternal[];
  author_ids: number[];
}

const media_type_to_string = [
  "odkaz",
  "spotify URI",
  "soundcloud",
  "youtube",
  "noty",
  "webová stránka autora",
  "youtube kanál",
  "audio soubor",
  "text s akordy (pdf)",
  "text (pdf)",
  "facebook",
  "instagram",
  "profilová fotka",
  "fotka",
];

export async function import_song_lyric(data: ImportSongLyric, db: Kysely<DB>) {
  const nowDates = dates();
  const secondary_name_1 = data.secondary_name_1 ?? null;
  const secondary_name_2 = data.secondary_name_2 ?? null;

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
    console.log(`Inserted song ${data.song_id}, ${data.name}`);
  }

  const song_lyric_exists = await db
    .selectFrom("song_lyrics")
    .select("id")
    .where("id", "=", data.id)
    .executeTakeFirst();

  const songLyricValues = {
    name: data.name,
    secondary_name_1,
    secondary_name_2,
    hymnology: data.hymnology,
    lang: data.lang,
    type: data.type_enum,
    has_chords: data.has_chords ? 1 : 0,
    song_id: data.song_id,
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
     console.log(`Updated song lyric ${data.id}, ${data.name}`);
  } else {
    await db
      .insertInto("song_lyrics")
      .values({
        id: data.id,
        ...songLyricValues,
        ...nowDates,
      })
      .execute();
    console.log(`Inserted song lyric ${data.id}, ${data.name}`);
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
      console.log(`Updated lyrics for song lyric ${data.id}`);
  } else {
    await db
      .insertInto("song_lyric_lyrics")
      .values({
        song_lyric_id: data.id,
        lyrics: data.lyrics,
      })
      .execute();
      console.log(`Inserted lyrics for song lyric ${data.id}`);
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
    console.log(`Associated tag ${tag_id} with song lyric ${data.id}`);
  }

  for (const external of data.externals) {
    const media_type = media_type_to_string[external.media_type] ?? null;

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
          media_type,
          updated_at: nowDates.updated_at,
        })
        .where("id", "=", external.id)
        .execute();
        console.log(`Updated external ${external.id} for song lyric ${data.id}`);
    } else {
      await db
        .insertInto("externals")
        .values({
          id: external.id,
          song_lyric_id: data.id,
          url: external.url,
          media_type,
          ...nowDates,
        })
        .execute();
        console.log(`Inserted external ${external.id} for song lyric ${data.id}`);
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
      console.log(`Associated author ${author_id} with song lyric ${data.id}`);
    }
  }
}