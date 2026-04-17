import { db } from "../database_repository/db_instance";
import { data } from "./non_existing";

const BASE_URL = "https://zpevnik.proscholy.cz/soubor/";

function normalize_url(url: string): string {
    const filename = url.replace(BASE_URL, "");
    // Replace EvK, EVK, ek prefixes with EK; add EK prefix if bare number
    const normalized = filename.replace(/^(EvK|EVK|ek)?(\d+(-\d+)?\.pdf)$/, "EK$2");
    return BASE_URL + normalized;
}

let updated = 0;

for (const external of data) {
    const new_url = normalize_url(external.url);
    if (new_url === external.url) {
        console.warn(`URL unchanged for external ${external.id}: ${external.url}`);
        continue;
    }

    await db.updateTable("externals")
        .set({
            url: new_url,
            updated_at: new Date(),
        })
        .where("url", "=", external.url)
        .execute();

    console.log(`Updated external ${external.id}: ${external.url} -> ${new_url}`);
    updated++;
}

console.log(`Updated ${updated} externals out of ${data.length} non-existing entries.`);

await db.destroy();
