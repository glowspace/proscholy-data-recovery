import { db } from "./db_instance";

// get the last id in song_lyrics table

const last_id = await db.selectFrom("song_lyrics")
  .select("id")
  .orderBy("id", "desc")
  .limit(1)
  .executeTakeFirst();

console.log("Last song_lyric id:", last_id?.id);