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
- `LEAD_WEBHOOK_URL`: optional automation webhook for new, duplicate, updated, and follow-up-due lead events
- `LEAD_WEBHOOK_SECRET`: optional secret sent as `X-Webhook-Secret`
- `DEFAULT_LEAD_OWNER`: optional owner label shown on automated lead plans
- `DUPLICATE_WINDOW_DAYS`: duplicate detection window, defaults to `90`

## Enrollment Automation

The CRM automatically:

- prevents duplicate active leads by matching phone or LINE ID
- creates the next follow-up action and due time for each status
- shows due follow-ups in the admin dashboard
- sends lead events to `LEAD_WEBHOOK_URL` when configured
