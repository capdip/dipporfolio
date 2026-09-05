# Domain Setup Guide for dipeshthapa23.com.np

This guide explains how to connect your domain `dipeshthapa23.com.np` with the frontend and backend of your portfolio.

## Architecture

- **Frontend**: React app (Vite) → built to `client/dist` → served by Vercel
- **Backend**: Express.js API → deployed as Vercel serverless function (`api/index.ts`)
- **API Connection**: Client uses `VITE_API_URL` env var to construct API base URL

## DNS Configuration

### Option 1: Using Vercel Nameservers (Recommended)

1. Go to your domain registrar (where you purchased `dipeshthapa23.com.np`)
2. Update the nameservers to:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### Option 2: Using CNAME Record

If you want to keep your current nameservers, add a CNAME record:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| CNAME | @    | cname.vercel-dns.com     |
| CNAME | www  | cname.vercel-dns.com     |

Or for Apex domain (root domain), use A records:

| Type | Name | Value      |
|------|------|------------|
| A    | @    | 76.76.21.21|
| CNAME| www  | cname.vercel-dns.com |

## Vercel Dashboard Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`dipportfolio`)
3. Go to **Settings** → **Domains**
4. Add the following domains:
   - `dipeshthapa23.com.np`
   - `www.dipeshthapa23.com.np`
5. Verify the DNS configuration is correct

## Environment Variables

The following environment variables are configured:

### Client (`client/.env`)
```
VITE_API_URL=https://dipeshthapa23.com.np
```

### Server (`.env` or Vercel Dashboard)
```
FRONTEND_URL=https://dipeshthapa23.com.np,https://www.dipeshthapa23.com.np
```

### Vercel Dashboard Environment Variables

Make sure to set these in your Vercel project settings:

| Variable                     | Value                                              |
|------------------------------|----------------------------------------------------|
| `FRONTEND_URL`               | `https://dipeshthapa23.com.np,https://www.dipeshthapa23.com.np` |
| `VITE_API_URL`               | `https://dipeshthapa23.com.np`                     |
| `MONGODB_URI`                | Your MongoDB connection string                     |
| `JWT_SECRET`                 | A secure random string (min 16 chars)              |
| `JWT_EXPIRES_IN`             | `7d`                                               |
| `NODE_ENV`                   | `production`                                       |
| `ADMIN_EMAIL`                | Your admin email                                   |
| `ADMIN_PASSWORD`             | A secure password (min 8 chars)                    |
| `ADMIN_NAME`                 | `Dipesh Thapa`                                     |

## Deployment

After configuring DNS and environment variables:

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Configure custom domain dipeshthapa23.com.np"
   git push origin main
   ```

2. Vercel will automatically deploy the changes

3. Verify the deployment:
   - Visit `https://dipeshthapa23.com.np`
   - Check the browser console for any CORS errors
   - Test the API: `https://dipeshthapa23.com.np/api/health`

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Verify `FRONTEND_URL` includes the correct origin with `https://` protocol
2. Check that the domain is in the `allowedOrigins` array in `server/src/index.ts`

### DNS Not Propagating
DNS changes can take up to 48 hours to propagate. You can check propagation status at:
- https://www.whatsmydns.net/

### SSL Certificate
Vercel automatically provisions SSL certificates for custom domains. This may take a few minutes after DNS is configured.

## Files Modified

- `vercel.json` - Added `alias` configuration for the custom domain
- `server/src/index.ts` - Added explicit CORS allowed origins for the custom domain
- `client/.env` - Created with `VITE_API_URL` pointing to the custom domain
- `.env` - Updated `FRONTEND_URL` to include protocol and www subdomain
