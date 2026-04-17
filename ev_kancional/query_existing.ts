import { data } from './query_data_updated';

const externals = data.song_lyrics.flatMap((sl) => sl.externals);

        // Match urls with "zpevnik.proscholy.cz" ending with pdf
const number_dot_pdf = externals.filter((e) => e.url.includes('zpevnik.proscholy.cz') && e.url.endsWith('.pdf'));

console.log(number_dot_pdf.length);

const non_existing = [];

// For each file, test if it is reachable via fetch
for (const e of number_dot_pdf) {
    try {
        const response = await fetch(e.url, { method: 'HEAD' });
        if (!response.ok) {
            non_existing.push(e);
        }
    } catch (error) {
        non_existing.push(e);
    }
}

console.log(non_existing);
console.log(non_existing.length);

// Bun.write('non_existing.txt', JSON.stringify(non_existing, null, 2));