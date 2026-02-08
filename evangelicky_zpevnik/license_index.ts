import csv from './ez_license.csv' with { type: 'text' };
import parse from 'csv-simple-parser';

const rows = parse(csv) as string[][];
const header = rows[0];
if (!header) {
	throw new Error('CSV is empty');
}

const ID_COLUMN = 'song_lyric_id';
const LICENCE_COLUMN = 'licence';

const id_index = header.indexOf(ID_COLUMN);
if (id_index === -1) {
	throw new Error(`Missing column: ${ID_COLUMN}`);
}

const licence_index = header.indexOf(LICENCE_COLUMN);
if (licence_index === -1) {
	throw new Error(`Missing column: ${LICENCE_COLUMN}`);
}

export const song_lyric_id__licence_type_cc = new Map<number, number>();

function csv_value_to_licence_type_cc(licence_type: number): number {
    const API_UNSET = 0;
    const API_PROPRIETARY_EVANGELICAL = 9;
    const API_PUBLISHABLE_EVANGELICAL = 10;
    // From the original Sheet:
    // Licence (0 = UNSET, 1 = PUBLISHABLE_EVANGELICAL, 2 = PROPRIETARY_EVANGELICAL)
    switch (licence_type) {
        case 0: return API_UNSET;
        case 1: return API_PUBLISHABLE_EVANGELICAL;
        case 2: return API_PROPRIETARY_EVANGELICAL;
        default: return API_UNSET;
    }
}

for (let i = 1; i < rows.length; i++) {
	const row = rows[i];
	if (!row) continue;

	const id_raw = (row[id_index] ?? '').trim();
	const licence_raw = (row[licence_index] ?? '').trim();

	const id = Number(id_raw);
	const licence = Number(licence_raw);

	if (!Number.isFinite(id) || !Number.isFinite(licence)) continue;
	song_lyric_id__licence_type_cc.set(id, csv_value_to_licence_type_cc(licence));
}
