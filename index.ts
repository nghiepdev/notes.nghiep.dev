import Fastify, {FastifyListenOptions} from 'fastify';
import {Deta} from 'deta';
import fs from 'fs';

import type {NoteText} from './types';
import {META_TITLE, META_DESCRIPTION, EXPIRE_IN} from './constants';

type NodeTextResponse = NoteText | null;

const __DEV = process.env.NODE_ENV === 'development';

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

const deta = Deta(process.env.APP_DETA_PROJECT_KEY);
const db = deta.Base(
  `${process.env.APP_NAME}:${process.env.NODE_ENV || 'default'}`,
);

app.get('/', async (request, reply) => {
  reply.headers({
    'content-type': 'text/html;charset=UTF-8',
  });

  const html = fs
    .readFileSync('./index.html')
    .toString()
    .replace(/{title_placeholder}/g, META_TITLE)
    .replace(/{title_no_markup_placeholder}/g, META_TITLE.replace(/[{}]/g, ''))
    .replace(/{description_placeholder}/g, META_DESCRIPTION)
    .replace(/{expire_in_placeholder}/g, JSON.stringify(EXPIRE_IN))
    .replace('{form_placeholder}', fs.readFileSync('./form.html').toString())
    .replace(
      '{template_placeholder}',
      fs.readFileSync('./template.html').toString(),
    );
  reply.send(html);
});

app.get<{
  Params: {
    id: string;
  };
}>('/:id', async (request, reply) => {
  const result = (await db.get(request.params.id)) as NodeTextResponse;

  if (result) {
    reply.send({
      __raw: `${request.protocol}://${request.hostname}/${result.key}/raw`,
      ...result,
    });
  }

  reply.status(404).send({
    message: 'Note not found!',
  });
});

app.get<{
  Params: {
    id: string;
  };
}>('/:id/raw', async (request, reply) => {
  const result = (await db.get(request.params.id)) as NodeTextResponse;

  if (result) {
    const {key, __expires, value, ...restData} = result;

    if (value) {
      reply.send(value);
    }

    reply.send(restData);
  }

  reply.status(404).send({
    message: 'Note not found!',
  });
});

app.post<{
  Querystring: {
    expire_in?: string;
  };
  Body: string;
}>('/', async (request, reply) => {
  const expireIn = request.query.expire_in;

  const result = (await db.put(request.body, undefined, {
    expireIn: expireIn ? +expireIn : undefined,
  })) as NodeTextResponse;

  if (result) {
    reply.headers({
      Location: `/${result.key}`,
    });

    reply.send(result);
  }

  reply.status(400).send({
    message: 'Oops! Something went wrong',
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
