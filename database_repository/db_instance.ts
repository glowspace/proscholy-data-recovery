import { Kysely, MysqlDialect } from "kysely";
import type { DB } from "./db";
import { createPool } from "mysql2";

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: "proscholy",
      host: "localhost",
      password: "test",
      user: "test",
    }),
  }),
});