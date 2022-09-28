import Fastify from 'fastify';

const __PORT = process.env.PORT || 3000;
const __DEV = process.env.NODE_ENV === 'development';

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

app.get('/', async (req, res) => {
  return {hello: 'world!'};
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
