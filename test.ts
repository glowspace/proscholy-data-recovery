import { Kysely, MysqlDialect } from "kysely";
import type { DB } from "kysely-codegen";
import { createPool } from "mysql2";

const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: "proscholy",
      host: "localhost",
      password: "test",
      user: "test",
    }),
  }),
});

interface External {
  id: number;
  media_id: string;
  url: string;
  media_type: number;
}

interface ImportSongLyric {
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
  externals: External[];
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

// TODO: import externals
// TODO: import tags

async function import_song_lyric(data: ImportSongLyric) {
  await db
    .insertInto("songs")
    .values({
      id: data.song_id,
      name: data.name,
    })
    .onConflict((oc) => oc.doNothing())
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
      })),
    )
    .execute();
}

// Further migrations:
// has anonymous author: autor Neznamy
