import fs from 'fs';
import {nanoid} from 'nanoid';
import Fastify, {FastifyListenOptions} from 'fastify';
import {isPlainObject} from 'is-plain-object';
import type {DetaType} from 'deta/dist/types/types/basic';

import type {NoteText, PostNoteText} from './types';
import {META_TITLE, META_DESCRIPTION, EXPIRE_IN} from './constants';
import {db, fetchNoteByKey, fetchNoteBySecretKey} from './db';

type NodeTextResponse = NoteText | null;

const __DEV = process.env.NODE_ENV === 'development';

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

function getClientHtml() {
  let clientHtml = fs
    .readFileSync('./client/index.html')
    .toString()
    .replace(/{title_placeholder}/g, META_TITLE)
    .replace(/{title_no_markup_placeholder}/g, META_TITLE.replace(/[{}]/g, ''))
    .replace(/{description_placeholder}/g, META_DESCRIPTION)
    .replace(/{expire_in_placeholder}/g, JSON.stringify(EXPIRE_IN))
    .replace(
      '{form_placeholder}',
      fs.readFileSync('./client/form.html').toString(),
    )
    .replace(
      '{modal_placeholder}',
      fs.readFileSync('./client/modal.html').toString(),
    );

  if (!__DEV) {
    clientHtml = clientHtml.replace(
      'vue.esm-browser.js',
      'vue.esm-browser.prod.js',
    );
  }

  return clientHtml;
}

const clientHtml = getClientHtml();
app.get('/', async (request, reply) => {
  reply.headers({
    'content-type': 'text/html;charset=UTF-8',
  });

  if (__DEV) {
    return reply.send(getClientHtml());
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
    return reply.send({
      __raw: `${request.protocol}://${request.hostname}/${
        result.__alias || result.key
      }/raw`,
      ...result,
      __secret: undefined,
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
    const {key, __expires, value, __secret, __alias, ...restData} = result;

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

  const content: Record<string, unknown> = {
    __secret: secret,
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
      message: 'Alias is too short.',
    });
  }

  const note = await fetchNoteBySecretKey(secret);

  if (note && note.key === key) {
    // Validate alias exists
    const {items} = await db.fetch({__alias: alias}, {limit: 1});

    if (items.length) {
      return reply.status(422).send({
        message: 'Alias is already taken. Please try another.',
      });
    }

    await db.update({__alias: alias}, key);

    reply.send({
      message: 'Alias has been successfully updated',
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
