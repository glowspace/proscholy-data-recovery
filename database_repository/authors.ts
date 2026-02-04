import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "../utils";

export interface ImportAuthor {
    id: number;
    name: string;
}

export async function import_authors(authors: ImportAuthor[], db: Kysely<DB>) {
    const existing_ids = await db
        .selectFrom('authors')
        .select(['id'])
        .execute()
        .then(rows => rows.map(row => row.id));

    const existing_ids_set = new Set(existing_ids);

    const new_authors = authors.filter(author => !existing_ids_set.has(author.id));

    if (new_authors.length === 0) {
        console.log("No new authors to import.");
        return;
    }

    await db.insertInto('authors').values(
        new_authors.map(author => ({
            id: author.id,
            name: author.name,
            ...dates(),
        }))
    ).execute();

    console.log(`Imported ${new_authors.length} authors.`);
}