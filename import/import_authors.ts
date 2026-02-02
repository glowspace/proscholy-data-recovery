import { import_authors, type Author } from "../authors";
import { db } from "../db_instance";
import { mobile_data } from "../mobile_data";

const authors: Author[] = [];

for (const author of mobile_data.authors) {
    authors.push({
        id: author.id,
        name: author.name,
    });
}

await import_authors(authors, db);