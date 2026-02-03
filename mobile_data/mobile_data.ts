import data from './data.json' with { type: 'json' };

export const mobile_data: Mobile.Root = data as Mobile.Root;

// Generated via https://transform.tools/json-to-typescript
// Edited.
export namespace Mobile {
    export interface Root {
      authors: Author[]
      externals: External[]
      song_lyrics: SongLyric[]
      songbooks: Songbook[]
      songbook_records: SongbookRecord[]
      tags: Tag[]
    }
    
    export interface Author {
      id: number
      name: string
    }
    
    export interface External {
      id: number
      public_name: string
      media_id?: string
      url: string
      media_type: number
    }
    
    export interface SongLyric {
      id: number
      display_id: string
      display_name: string
      name: string
      secondary_name_1?: string
      secondary_name_2?: string
      lyrics?: string
      hymnology: string
      lang: string
      lang_string: string
      type_enum: number
      has_chords: boolean
      is_arrangement: boolean
      accidentals: any
      show_chords: any
      transposition: any
      song?: IdObject<string>
      authors_pivot: AuthorsPivot[]
      tags: IdObject<number>[]
      externals: External[]
      songbook_records: SongbookRecord[]
    }
    
    export interface AuthorsPivot {
      pivot: Pivot
    }
    
    export interface Pivot {
      author: IdObject<number>
    }
    
    export interface SongbookRecord{
      id: number
      number: string
      song_lyric: IdObject<string>
      songbook: IdObject<string>
    }
    
    export interface Songbook {
      id: number
      name: string
      shortcut: string
      color?: string
      color_text?: string
      is_private: boolean
      is_pinned: any
      records: Record[]
    }
    
    export interface Record {
      id: number
      number: string
      song_lyric: IdObject<string>
      songbook: IdObject<string>
    }
    
    export interface Tag {
      id: number
      name: string
      type_enum: number
      song_lyrics_count: number
    }

}

interface IdObject<T> {
    id: T;
}
