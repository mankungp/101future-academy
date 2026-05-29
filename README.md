# 101 Future Academy

Standalone enrollment and lead CRM for 101future.com.

## Local

```bash
npm start
```

Open:

- Website: http://127.0.0.1:4173
- Admin: http://127.0.0.1:4173/admin

Set `ADMIN_TOKEN` in production. If it is omitted locally, the server writes a generated token to `data/admin-token.txt`.

## Production

```bash
ADMIN_TOKEN=your-secret-token npm start
```

Optional:

- `PORT`: server port
- `HOST`: bind host, defaults to `127.0.0.1`
- `DATA_DIR`: lead storage directory, defaults to `./data`
