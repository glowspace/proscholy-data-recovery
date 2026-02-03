import type { Kysely } from "kysely";
import type { DB } from "./db";


export interface ImportTag {
    id: number;
}

export async function import_nonexistent_tags(tags: ImportTag[], db: Kysely<DB>) {
    // Get existing tag IDs.
}