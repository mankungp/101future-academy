# 101 Future Academy

Standalone Phase 0.5/1 EdTech enrollment, checkout, payment confirmation, and gated learning portal for 101future.com.

Current product focus:

- Phase 0.5: lesson engine, monthly payment gate, entitlement unlock, progress-ready data.
- Phase 1: English Speaking + Grammar for M.1-M.3.
- Pricing starts at 299 THB / 30 days for English Monthly.
- Later bundles add Math, Science, Thai, high school, primary, and kindergarten in phase order.

Roadmap: see [EDTECH_10_PHASES.md](./EDTECH_10_PHASES.md).

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
- `LEAD_WEBHOOK_URL`: optional event webhook for enrollment, order, and payment events
- `LEAD_WEBHOOK_SECRET`: optional secret sent as `X-Webhook-Secret`
- `DEFAULT_LEAD_OWNER`: optional owner label shown on automated lead plans
- `DUPLICATE_WINDOW_DAYS`: duplicate detection window, defaults to `90`
- `PAYMENT_PROVIDER`: payment provider key, use `kbank` for KBank QR API
- `PAYMENT_PROVIDER_API_KEY`: provider API key used by the payment adapter
- `PAYMENT_WEBHOOK_SECRET`: webhook verification secret/token used to verify bank callbacks
- `KBANK_QR_CREATE_URL`: KBank QR API endpoint from https://apiportal.kasikornbank.com/
- `KBANK_MERCHANT_ID`: merchant id from KBank API Portal
- `KBANK_TERMINAL_ID`: optional terminal id from KBank API Portal
- `KBANK_BRANCH_ID`: optional branch id from KBank API Portal
- `KBANK_API_KEY_HEADER`: API key header name, defaults to `x-api-key`
- `KBANK_WEBHOOK_TOKEN_HEADER`: callback token header name, defaults to `x-callback-token`
- `XENDIT_API_VERSION`: Xendit Payment Request API version, defaults to `2024-11-11`
- `SITE_ORIGIN`: public site URL, defaults to `https://www.101future.com`
- `ACCESS_DAYS`: learning entitlement length, defaults to `30`
- `EASYSLIP_API_KEY`: EasySlip API key used to verify Thai bank slips server-side
- `EASYSLIP_MATCH_ACCOUNT`: set to `true` to require EasySlip receiver account matching
- `COURSE_PRICES_JSON`: JSON object for server-side amount matching, for example `{"English Monthly":299,"English + Math":399,"All ม.ต้น":599}`
- `DEFAULT_COURSE_PRICE`: fallback amount if a course is not in `COURSE_PRICES_JSON`

## Enrollment Automation

The enrollment system automatically:

- prevents duplicate active leads by matching phone or LINE ID
- exposes English M.1-M.3 packages through `/api/packages`
- creates orders through `/api/orders`
- creates KBank Dynamic Thai QR requests when `PAYMENT_PROVIDER=kbank`
- verifies payment callbacks with `PAYMENT_WEBHOOK_SECRET`
- checks paid amount against the locked order amount
- unlocks `/learn` content for 30 days after payment confirmation
- keeps EasySlip as a manual-transfer fallback when configured
- keeps admin for exceptions, rejected slips, and exports
