import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "./utils";

export interface Author {
    id: number;
    name: string;
}

export async function import_authors(authors: Author[], db: Kysely<DB>) {
    const existing_ids = await db
        .selectFrom('authors')
        .select(['id'])
        .execute()
        .then(rows => rows.map(row => row.id));

    const existing_ids_set = new Set(existing_ids);

    const new_authors = authors.filter(author => !existing_ids_set.has(author.id));

    await db.insertInto('authors').values(
        new_authors.map(author => ({
            id: author.id,
            name: author.name,
            ...dates(),
        }))
    ).execute();
}