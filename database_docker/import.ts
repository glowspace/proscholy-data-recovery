import { $ } from "bun";

const pass = process.env.DB_PASSWORD;
const user = process.env.DB_USERNAME;
const database = process.env.DB_DATABASE;

await $`docker compose exec -T db sh -lc 'gunzip -c /home/backup/proscholy_2022_migrated.sql.gz | mysql -u ${user} -p"${pass}" ${database}'`