# FREE TEXT NOTES

> The simplest way to keep text notes. Light, clean, and free.  
> This free online notepad allows you to create notes in a web browser. No sign up required. Free forever. Never expired.  
> https://freetext.deta.dev

![FreeText](./screenshot.png)

## API

### Create a Note

```bash
$ curl -X POST https://freetext.deta.dev \
-H 'Content-Type: text/plain' \
-d 'Your text content'
```

### Get a Note

```bash
$ curl https://freetext.deta.dev/<key>
```

with raw only

```bash
$ curl https://freetext.deta.dev/<key>/raw
```

## License

MIT
