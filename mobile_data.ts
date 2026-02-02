import data from './data.json' with { type: 'json' };

interface MobileData {
    song_lyrics: any[];
    authors: any[];
    externals: any[];
    tags: any[];
}

export const mobile_data: MobileData = data as MobileData;