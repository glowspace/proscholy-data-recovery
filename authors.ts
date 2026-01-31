import type { Kysely } from "kysely";
import type { DB } from "kysely-codegen";
import { dates } from "./utils";

export interface Author {
    id: number;
    name: string;
}

export async function import_authors(authors: Author[], db: Kysely<DB>) {
    await db.insertInto('authors').values(
        authors.map(author => ({
            id: author.id,
            name: author.name,
            ...dates(),
        }))
    ).onConflict(oc => oc.column('id').doNothing()).execute();
}