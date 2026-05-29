# 101 Future Academy

Standalone enrollment, slip verification, and gated learning portal for 101future.com.

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
- `EASYSLIP_API_KEY`: EasySlip API key used to verify Thai bank slips server-side
- `EASYSLIP_MATCH_ACCOUNT`: set to `true` to require EasySlip receiver account matching
- `COURSE_PRICES_JSON`: JSON object for server-side amount matching, for example `{"AI 101":2900,"Code & Create":3200}`
- `DEFAULT_COURSE_PRICE`: fallback amount if a course is not in `COURSE_PRICES_JSON`

## Enrollment Automation

The enrollment system automatically:

- prevents duplicate active leads by matching phone or LINE ID
- verifies uploaded Thai bank slips through EasySlip when configured
- rejects duplicate slips and mismatched amounts
- unlocks `/learn` content immediately after payment verification
- keeps admin for exceptions, rejected slips, and exports
