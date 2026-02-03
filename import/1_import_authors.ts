import { import_authors, type ImportAuthor } from "../authors";
import { db } from "../db_instance";
import { mobile_data } from "../mobile_data/mobile_data";

const authors: ImportAuthor[] = [];

for (const author of mobile_data.authors) {
    authors.push({
        id: author.id,
        name: author.name,
    });
}

await import_authors(authors, db);
await db.destroy();