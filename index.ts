import Fastify from 'fastify';
import {Deta} from 'deta';

const __PORT = process.env.PORT || 3000;
const __DEV = process.env.NODE_ENV === 'development';

interface Note {
  key: string;
  value: string;
}

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

const deta = Deta(process.env.APP_DETA_PROJECT_KEY);
const db = deta.Base(process.env.APP_NAME);

app.get('/', async (request, reply) => {
  // TODO: Build UI
  return {hello: 'world!'};
});

app.get<{
  Params: {
    id: string;
  };
}>('/:id', async (request, reply) => {
  const note = (await db.get(request.params.id)) as unknown as Note;

  if (note) {
    return note.value;
  }

  reply.status(404).send('Note not found!');
});

app.post<{
  Body: string;
}>('/', async (request, reply) => {
  const result = (await db.put(request.body)) as unknown as Note;

  reply.headers({
    Location: `/${result.key}`,
  });

  reply.send(result);
});

const start = async () => {
  try {
    await app.listen({port: +__PORT});
    const address = app.server.address();
    const port = typeof address === 'string' ? address : address?.port;

    console.log(`App listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (__DEV) {
  start();
}

module.exports = app;
