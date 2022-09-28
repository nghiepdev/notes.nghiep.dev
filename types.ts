interface BaseNoteText {
  key: string;
  __expires?: number;
}

export type NoteText =
  | (BaseNoteText & {value: string})
  | (BaseNoteText & Record<string, unknown>);
