import { Kysely, MysqlDialect } from "kysely";
import type { DB } from "./db";
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


// get the last id in song_lyrics table

const last_id = await db.selectFrom("song_lyrics")
  .select("id")
  .orderBy("id", "desc")
  .limit(1)
  .executeTakeFirst();

console.log("Last song_lyric id:", last_id?.id);