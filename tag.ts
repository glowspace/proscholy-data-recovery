import type { Kysely } from "kysely";
import type { DB } from "./db";
import { dates } from "./utils";


export interface ImportTag {
    id: number;
    name: string;
    type: number;
}

export async function remove_all_taggables(db: Kysely<DB>) {
    await db.deleteFrom('taggables').execute();
}

export async function import_tags(tags: ImportTag[], db: Kysely<DB>) {
    const existing_tag_ids = await db.selectFrom('tags').select('id').execute();
    const existing_tag_id_set = new Set(existing_tag_ids.map(t => t.id));

    const tags_to_insert: ImportTag[] = [];
    const tags_to_update: ImportTag[] = [];
    for (const tag of tags) {
        if (existing_tag_id_set.has(tag.id)) {
            tags_to_update.push(tag);
        } else {
            tags_to_insert.push(tag);
        }
    }

    for (const tag of tags_to_update) {
        await db.updateTable('tags').set({ name: tag.name, type: tag.type }).where('id', '=', tag.id).execute();
    }
    console.log(`Updated ${tags_to_update.length} tags.`);
    
    await db.insertInto('tags').values(tags_to_insert.map(tag => ({
        id: tag.id,
        name: tag.name,
        type: tag.type,
        ...dates(),
    }))).execute();

    console.log(`Imported ${tags_to_insert.length} tags.`);
}