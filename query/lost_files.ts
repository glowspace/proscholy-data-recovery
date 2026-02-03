import fs from 'fs/promises';
import path from 'path';
import { mobile_data } from '../mobile_data/mobile_data';

interface UploadedFile {
    media_id: string;  
    song_lyric_id: number;  
    song_lyric_name: string; 
}

const uploaded_files: UploadedFile[] = [];
for (const song_lyric of mobile_data.song_lyrics) {
    // Files are stored in the database as "externals".
    for (const external of song_lyric.externals) {
        if (external.url.startsWith('https://zpevnik.proscholy.cz') && external.media_id !== undefined) {
            uploaded_files.push({ 
                media_id: external.media_id,
                song_lyric_id: song_lyric.id,
                song_lyric_name: song_lyric.name,
            });
        }
    }
}

const dir = path.join(__dirname, '../public_files/zps_public_files');
const files = await fs.readdir(dir);
const file_names_set = new Set(files);

const lost_files: Set<UploadedFile> = new Set();

for (const uploaded_file of uploaded_files) {
    if (file_names_set.has(uploaded_file.media_id)) {
        continue;
    }
    if (uploaded_file.media_id.startsWith('ez/pdf')) {
        continue;
    }
    lost_files.add(uploaded_file);
}

for (const lost_file of lost_files) {
    console.log([lost_file.media_id, lost_file.song_lyric_id, lost_file.song_lyric_name].join('; '));
}