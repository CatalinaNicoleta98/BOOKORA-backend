# Environment Configuration

Bookora keeps environment variables out of Git. Create local `.env*` files on your machine or configure variables in your hosting dashboard instead of committing them.

## Backend Variables

Required:

- `DBHOST`
- `TOKEN_SECRET`

Configured per environment:

- `CORS_ORIGINS`
- `NODE_ENV`
- `PORT` (optional)

Render production values:

- `CORS_ORIGINS=https://bookora.catalinavrinceanu.com`
- `NODE_ENV=production`

## Notes

- `CORS_ORIGINS` accepts a comma-separated list of allowed origins.
- Keep database credentials and token secrets only in local env files or hosting dashboards.
