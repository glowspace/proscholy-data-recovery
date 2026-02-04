import { $ } from 'bun';
import csv from './seznam.csv' with { type: 'text' };
import parse from 'csv-simple-parser';

const csv_escape = (value: string) => {
    if (!/[\n\r",]/.test(value)) return value;
    return `"${value.replaceAll('"', '""')}"`;
};

const rows = parse(csv) as string[][];
const header = rows[0];
if (!header) {
    throw new Error('CSV is empty');
}

const URL_COLUMN = 'v archivu';
const url_index = header.indexOf(URL_COLUMN);
if (url_index === -1) {
    throw new Error(`Missing column: ${URL_COLUMN}`);
}

const DOWNLOADED_COLUMN = 'downloaded';
let downloaded_index = header.indexOf(DOWNLOADED_COLUMN);
if (downloaded_index === -1) {
    header.push(DOWNLOADED_COLUMN);
    downloaded_index = header.length - 1;
}


for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    while (row.length < header.length) row.push('');

    const file = (row[url_index] ?? '').trim();
    let downloaded = false;

    const file_name = file.split('/soubor/')[1];
    if (file_name && await Bun.file(`./internet_archive_files/${file_name}`).exists()) {    
        row[downloaded_index] = 'true';
        console.log(`Skipping: ${file_name}`);
        continue;
    }

    const file_raw = file.replace('/https://', 'id_/https://');

    if (file.startsWith('http')) {
        try {
            await $`wget -c ${file_raw} -P ./internet_archive_files/`;
            // sleep 10 second
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            downloaded = true;
        }
        catch {
            console.error(`Failed to download file: ${file_raw}`);
        }
    }

    row[downloaded_index] = downloaded ? 'true' : 'false';
}

await Bun.write(
    new URL('./seznam.csv', import.meta.url),
    rows
        .map((row) => {
            while (row.length < header.length) row.push('');
            return row.map((cell) => csv_escape(String(cell ?? ''))).join(',');
        })
        .join('\n') +
        '\n',
);
