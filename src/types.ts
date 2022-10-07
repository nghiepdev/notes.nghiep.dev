import type {DetaType} from 'deta/dist/types/types/basic';

interface BaseNoteText {
  key: string;
  __secret?: string;
  __expires?: number;
  __alias?: string;
  __views: number;
}

export type NoteText =
  | (BaseNoteText & {value: string})
  | (BaseNoteText & Record<string, unknown>);

export interface PostNoteText extends Record<string, unknown> {
  __secret?: string;
  key?: string;
  value?: DetaType;
  expire_in?: number;
  __views?: number;
}

export interface GetHtmlClientOptions {
  shouldReplace: boolean;
}
