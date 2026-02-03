import { db } from "../db_instance";
import { mobile_data } from "../mobile_data/mobile_data";
import { import_tags, remove_all_taggables } from "../tag";

await remove_all_taggables(db);

await import_tags(mobile_data.tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    type: convert_tag_type(tag.type_enum),
})), db);

await db.destroy();


function convert_tag_type(type_enum: number): number {
    // Taken from proscholy-api/graphql/tag.graphql
    const DB_TAGS = {
        GENERIC: 0,
        LITURGY_PART: 1,
        LITURGY_PERIOD: 2,
        SAINTS: 3,
        HISTORY_PERIOD: 10,
        INSTRUMENTATION: 50,
        GENRE: 100,
        MUSICAL_FORM: 4,
        SACRED_OCCASION: 5,
        TOPIC: 6,
        LITURGY_DAY: 40,
    };

    switch (type_enum) {
        case -1:
        case 2:
            return DB_TAGS.GENERIC;
        case 0:
            return DB_TAGS.LITURGY_PART;
        case 1:
            return DB_TAGS.LITURGY_PERIOD;
        case 3:
            return DB_TAGS.HISTORY_PERIOD;
        case 4:
            return DB_TAGS.INSTRUMENTATION;
        case 5:
            return DB_TAGS.GENRE;
        case 6:
            return DB_TAGS.MUSICAL_FORM;
        case 7:
            return DB_TAGS.SACRED_OCCASION;
        case 8:
            // The SAINTS overlap with LITURGY_DAY. We need to do something about that.
            return DB_TAGS.SAINTS;
        case 10:
            return DB_TAGS.LITURGY_DAY;
        default:
            throw new Error(`Unknown tag type_enum: ${type_enum}`);
    }
}