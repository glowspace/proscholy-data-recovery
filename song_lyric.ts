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
  await db
    .insertInto("songs")
    .values({
      id: data.song_id,
      name: data.name,
      ...dates(),
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();

  await db
    .insertInto("song_lyrics")
    .values({
      id: data.id,
      name: data.name,
      secondary_name_1: data.secondary_name_1,
      secondary_name_2: data.secondary_name_2,
      hymnology: data.hymnology,
      lang: data.lang,
      type: data.type_enum,
      has_chords: data.has_chords ? 1 : 0,
      ...dates(),
    })
    .execute();

  await db
    .insertInto("song_lyric_lyrics")
    .values({
      song_lyric_id: data.id,
      lyrics: data.lyrics,
    })
    .execute();

  await db
    .insertInto("taggables")
    .values(
      data.tag_ids.map((tag_id) => ({
        taggable_type: "App\\SongLyric",
        taggable_id: data.id,
        tag_id,
      })),
    )
    .execute();

  await db
    .insertInto("externals")
    .values(
      data.externals.map((external) => ({
        song_lyric_id: data.id,
        url: external.url,
        media_type: media_type_to_string[external.media_type],
        ...dates(),
      })),
    )
    .execute();

  await db.insertInto('author_song_lyric').values(
    data.author_ids.map((author_id) => ({
      author_id,
      song_lyric_id: data.id,
    })),
  ).execute();
}