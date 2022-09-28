import Fastify, {FastifyListenOptions} from 'fastify';
import {Deta} from 'deta';

import type {NoteText} from './types';

type NodeTextResponse = NoteText | null;

const __DEV = process.env.NODE_ENV === 'development';

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

const deta = Deta(process.env.APP_DETA_PROJECT_KEY);
const db = deta.Base(
  __DEV ? `${process.env.APP_NAME}_dev` : process.env.APP_NAME,
);

app.get('/', async (request, reply) => {
  // TODO: Build UI
  return {hello: 'world!'};
});

app.get<{
  Params: {
    id: string;
  };
}>('/:id', async (request, reply) => {
  const result = (await db.get(request.params.id)) as NodeTextResponse;

  if (result) {
    reply.send(result);
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
  Body: string;
}>('/', async (request, reply) => {
  const result = (await db.put(request.body, undefined)) as NodeTextResponse;

  if (result) {
    reply.headers({
      Location: `/${result.key}`,
    });

    reply.send(result);
  }

  reply.status(400).send({
    message: 'Oops! Something went wrong!',
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
