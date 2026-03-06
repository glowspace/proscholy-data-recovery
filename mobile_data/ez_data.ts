import data from './ez_data.json' with { type: 'json' };

export const mobile_ez_data = data.data as Data; 

export interface Data {
  authors: Author[]
  tags_enum: TagsEnum[]
  songbooks: Songbook[]
  songs: Song[]
  song_lyrics: SongLyric[]
}

export interface Author {
  id: string
  name: string
}

export interface TagsEnum {
  id: string
  name: string
  type_enum: string
  song_lyrics_count: number
}

export interface Songbook {
  id: string
  name: string
  shortcut?: string
  color?: string
  color_text?: string
  is_private: boolean
}

export interface Song {
  id: string
  name: string
}

export interface SongLyric {
  id: string
  name: string
  secondary_name_1?: string
  secondary_name_2?: string
  lyrics: string
  hymnology: string
  lang: string
  lang_string: string
  type_enum: string
  is_arrangement: boolean
  has_chords: boolean
  song: Song2
  songbook_records: SongbookRecord[]
  externals: External[]
  authors_pivot: AuthorsPivot[]
  tags: Tag[]
}

export interface Song2 {
  id: string
}

export interface SongbookRecord {
  pivot: Pivot
}

export interface Pivot {
  id: string
  number: string
  song_name?: string
  song_lyric: SongLyric2
  songbook: Songbook2
}

export interface SongLyric2 {
  id: string
}

export interface Songbook2 {
  id: string
}

export interface External {
  id: string
  public_name: string
  url: string
  media_id?: string
  media_type?: string
}

export interface AuthorsPivot {
  pivot: Pivot2
}

export interface Pivot2 {
  author: Author2
}

export interface Author2 {
  id: string
}

export interface Tag {
  id: string
}
