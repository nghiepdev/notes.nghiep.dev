import {Deta} from 'deta';
import type {CompositeType} from 'deta/dist/types/types/basic';

import type {NoteText} from './types';

const deta = Deta(process.env.APP_DETA_PROJECT_KEY);

type NodeTextResponse = NoteText | null;

export const db = deta.Base(process.env.APP_DETA_BASE);

async function dbQuery<D extends unknown>(
  query: CompositeType,
  options: {
    limit: number;
  },
) {
  let res = await db.fetch(query);
  let allItems = res.items;

  while (res.last && allItems.length < options.limit) {
    res = await db.fetch(query, {last: res.last});
    allItems = allItems.concat(res.items);
  }

  const items = allItems.slice(0, options.limit) as D[];

  return {
    items,
    count: items.length,
    last: res.last,
  };
}

export async function fetchNoteByKey(key: string) {
  const result = (await db.get(key)) as NodeTextResponse;

  if (result) {
    return result;
  }

  const {items} = await dbQuery<NodeTextResponse>({__alias: key}, {limit: 1});

  return items[0];
}

export async function fetchNoteBySecretKey(__secret: string) {
  const {items} = await dbQuery<NodeTextResponse>({__secret}, {limit: 1});

  return items[0];
}

export async function fetchNoteByValue(value: unknown) {
  if (typeof value === 'object') {
    return undefined;
  }

  const {items} = await dbQuery<NodeTextResponse>(
    {value: value as never},
    {limit: 1},
  );

  return items[0];
}

export function increaseNoteViewCount(note: NoteText) {
  return db.update(
    {
      __views: db.util.increment(1),
    },
    note.key,
  );
}
