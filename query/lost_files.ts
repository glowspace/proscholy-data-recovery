import data from '../data.json' with { type: 'json' };
const d = data as any;

interface PhoneExternal {
    media_id: string;  
    song_lyric_id: number;
    song_lyric_name: string; 
}

const uploaded_files: PhoneExternal[] = [];
for (const song_lyric of d.song_lyrics) {
    for (const external of song_lyric.externals) {
        if (external.url.startsWith('https://zpevnik.proscholy.cz')) {
            uploaded_files.push({ 
                media_id: external.media_id,
                song_lyric_id: song_lyric.id,
                song_lyric_name: song_lyric.name,
            });
        }
    }
}

import fs from 'fs/promises';
import path from 'path';

const dir = path.join(__dirname, '../public_files/zps_public_files');
const files = await fs.readdir(dir);
const file_names_set = new Set(files);

const lost_files: Set<PhoneExternal> = new Set();

for (const uploaded_file of uploaded_files) {
    if (file_names_set.has(uploaded_file.media_id)) {
        continue;
    }
    // if (uploaded_file.media_id.match(/^(kan|ek|EK)[\da-z]+\.pdf/)) {
    //     continue;
    // }
    // if (uploaded_file.media_id.endsWith('.xml')) {
    //     continue;
    // }
    if (uploaded_file.media_id.startsWith('ez/pdf')) {
        continue;
    }
    lost_files.add(uploaded_file);
}

for (const lost_file of lost_files) {
    console.log([lost_file.media_id, lost_file.song_lyric_id, lost_file.song_lyric_name].join('; '));
}