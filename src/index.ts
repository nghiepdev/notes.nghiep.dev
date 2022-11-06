import {nanoid} from 'nanoid';
import mime from 'mime-types';
import Fastify, {FastifyListenOptions} from 'fastify';
import FastifyCors from '@fastify/cors';
import FastifyRateLimit, {RateLimitOptions} from '@fastify/rate-limit';
import {isPlainObject} from 'is-plain-object';
import type {DetaType} from 'deta/dist/types/types/basic';

import type {NoteText, PostNoteText} from './types';
import {
  db,
  fetchNoteByKey,
  fetchNoteBySecretKey,
  fetchNoteByValue,
  increaseNoteViewCount,
} from './db';
import {getClientHtml} from './utils';

type NodeTextResponse = NoteText | null;

const __DEV = process.env.NODE_ENV === 'development';

const clientHtml = getClientHtml({
  shouldReplace: true,
});

const app = Fastify({
  bodyLimit: 100 * 1024 * 1024, // 100MiB
});

app.register(FastifyCors);
app.register(FastifyRateLimit, {
  global: false,
});

app.register(async fastify => {
  fastify.get('/', async (request, reply) => {
    reply.type('text/html; charset=utf-8');

    if (__DEV) {
      return reply.send(
        getClientHtml({
          shouldReplace: false,
        }),
      );
    }

    reply.send(clientHtml);
  });

  fastify.get<{
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
        __views: result.__views + 1,
      });
    }

    reply.status(404).send({
      message: 'Note not found!',
    });
  });

  fastify.get<{
    Params: {
      key: string;
    };
    Querystring: {
      type: string;
    };
  }>('/:key/raw', async (request, reply) => {
    const result = await fetchNoteByKey(request.params.key);

    if (result) {
      await increaseNoteViewCount(result);

      const {
        key,
        value,
        __expires,
        __secret,
        __alias,
        __views,
        __created_at,
        ...restData
      } = result;

      if (value) {
        const contentType = mime.contentType(request.query.type);
        if (contentType) {
          reply.type(contentType);
        }
        return reply.send(value);
      }

      return reply.send(restData);
    }

    reply.status(404).send({
      message: 'Note not found!',
    });
  });

  fastify.post<{Body: DetaType | PostNoteText}, {rateLimit: RateLimitOptions}>(
    '/',
    {config: {rateLimit: {max: 100, timeWindow: '1 minute'}}},
    async (request, reply) => {
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
        delete body.__created_at;

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

      const content: Partial<
        Pick<NoteText, '__secret' | '__views' | '__created_at' | 'value'>
      > = {
        __secret: secret,
        __views: 0,
        __created_at: Math.floor(+new Date() / 1000),
      };

      if (isPlainObject(value)) {
        Object.assign(content, {
          ...content,
          ...(value as PostNoteText),
        });
      } else {
        content.value = value;
      }

      // Avoid dupplicate value
      const exists = await fetchNoteByValue(content.value);
      if (exists) {
        reply.headers({
          Location: `/${exists.key}`,
        });
        return reply.send({
          ...exists,
          __secret: undefined,
        });
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
    },
  );

  fastify.put<{
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

export = app;
