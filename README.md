# NOTES

> The simplest way to keep text notes. Light, clean, and free.  
> No Ads, no sign up, no monitoring, nothing. Free forever. Never expired.  
> Deploy on Deta https://deta.space/discovery/@nghiepit/freetext

![Text Note](./screenshot.png)

The app targets modern browsers. Using JavaScript modules and ES6 features and more.

## API

### Create a Note

```bash
$ curl -X POST https://notes.nghiep.dev \
-H 'Content-Type: text/plain' \
-d 'Your text content'
```

### Get a Note

```bash
$ curl https://yourapp.deta.app/<key>
```

with raw only

```bash
$ curl https://yourapp.deta.app/<key>/raw
```

### Format output type

```bash
$ curl https://yourapp.deta.app/<key>.html
```

Examples HTML output type

[https://notes.nghiep.dev/christmas.html](https://notes.nghiep.dev/christmas.html)  
[https://notes.nghiep.dev/happynewyear2023.html](https://freetext-1-x1736414.deta.app/happynewyear2023.html)

## License

MIT
