import {nanoid} from 'nanoid';
import Fastify, {FastifyListenOptions} from 'fastify';
import {isPlainObject} from 'is-plain-object';
import type {DetaType} from 'deta/dist/types/types/basic';

import type {NoteText, PostNoteText} from './types';
import {
  db,
  fetchNoteByKey,
  fetchNoteBySecretKey,
  increaseNoteViewCount,
} from './db';
import {getClientHtml} from './utils';

type NodeTextResponse = NoteText | null;

const __DEV = process.env.NODE_ENV === 'development';

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

const clientHtml = getClientHtml({
  shouldReplace: true,
});

app.get('/', async (request, reply) => {
  reply.headers({
    'content-type': 'text/html;charset=UTF-8',
  });

  if (__DEV) {
    return reply.send(
      getClientHtml({
        shouldReplace: false,
      }),
    );
  }

  reply.send(clientHtml);
});

app.get<{
  Params: {
    key: string;
  };
}>('/:key', async (request, reply) => {
  const result = await fetchNoteByKey(request.params.key);

  if (result) {
    await increaseNoteViewCount(result);

    return reply.send({
      __raw: `${request.protocol}://${request.hostname}/${
        result.__alias || result.key
      }/raw`,
      ...result,
      __secret: undefined,
      __views: (result.__views || 0) + 1,
    });
  }

  reply.status(404).send({
    message: 'Note not found!',
  });
});

app.get<{
  Params: {
    key: string;
  };
}>('/:key/raw', async (request, reply) => {
  const result = await fetchNoteByKey(request.params.key);

  if (result) {
    await increaseNoteViewCount(result);

    const {key, __expires, value, __secret, __alias, __views, ...restData} =
      result;

    if (value) {
      return reply.send(value);
    }

    return reply.send(restData);
  }

  reply.status(404).send({
    message: 'Note not found!',
  });
});

app.post<{
  Body: DetaType | PostNoteText;
}>('/', async (request, reply) => {
  const isJson = request.headers['content-type'] === 'application/json';
  const secret = nanoid(10);
  let value = request.body;
  let expireIn = 0;

  if (isJson) {
    const body = request.body as PostNoteText;

    // Delete key and __secret
    delete body.key;
    delete body.__secret;
    delete body.__views;

    if (body.value) {
      value = body.value;
      delete body.value;
    } else {
      value = body;
    }

    if (body.expire_in) {
      expireIn = body.expire_in;
      delete body.expire_in;
    }
  }

  const content: Partial<Pick<NoteText, '__secret' | '__views' | 'value'>> = {
    __secret: secret,
    __views: 0,
  };

  if (isPlainObject(value)) {
    Object.assign(content, {
      ...content,
      ...(value as PostNoteText),
    });
  } else {
    content.value = value;
  }

  const result = (await db.put(content as DetaType, undefined, {
    expireIn: expireIn ? +expireIn : undefined,
  })) as NodeTextResponse;

  if (result) {
    reply.headers({
      Location: `/${result.key}`,
    });

    return reply.send(result);
  }

  reply.status(400).send({
    message: 'Oops! Something went wrong',
  });
});

app.put<{
  Params: {
    key: string;
    secret: string;
  };
  Body: {
    alias: string;
  };
}>('/:key/:secret', async (request, reply) => {
  const {key, secret} = request.params;
  const {alias} = request.body;

  if (!alias || alias.length < 3) {
    return reply.status(422).send({
      message: 'The alias is too short',
    });
  }

  const note = await fetchNoteBySecretKey(secret);

  if (note && note.key === key) {
    // Validate alias exists
    const item = await fetchNoteByKey(alias);

    if (item) {
      return reply.status(422).send({
        message: 'The alias is already taken',
      });
    }

    await db.update({__alias: alias}, key);

    return reply.send({
      message: 'The alias has been successfully updated',
    });
  }

  reply.status(404).send({
    message: 'Note not found!',
  });
});

const start = async (options: FastifyListenOptions) => {
  app.listen(options, (error, address) => {
    if (error) {
      throw error;
    }

    console.info(`⚡⚡⚡ Server ready at ${address}`);
  });
};

if (__DEV) {
  start({
    port: +(process.env.PORT || 3000),
  });
}

module.exports = app;
