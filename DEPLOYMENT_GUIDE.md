# Frontend Deployment Guide

## Automatic Environment Configuration

The frontend automatically connects to the correct backend based on the deployed branch:

### Branch → Backend Mapping

| Branch | Frontend URL | Backend API URL |
|--------|-------------|-----------------|
| `staging` | `staging.d3woglqf7depd.amplifyapp.com` | `https://13.234.140.190.nip.io/staging/api/v1` |
| `prod` | `prod.d3woglqf7depd.amplifyapp.com` | `https://13.234.140.190.nip.io/api/v1` |

### How It Works

The `amplify.yml` file automatically generates the correct `.env.production` file during build based on the `AWS_BRANCH` environment variable:

```yaml
preBuild:
  commands:
    - |
      if [ "${AWS_BRANCH}" = "staging" ]; then
        echo "NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/staging/api/v1" > .env.production
      else
        echo "NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/api/v1" > .env.production
      fi
```

### Deployment Workflow

1. **Develop on staging:**
   ```bash
   git checkout staging
   # Make changes
   git add .
   git commit -m "feat: new feature"
   git push origin staging
   ```
   - Amplify auto-deploys to staging URL
   - Connects to staging backend automatically
   - Uses `poultry_stage` database

2. **Promote to production:**
   ```bash
   git checkout prod
   git merge staging
   git push origin prod
   ```
   - Amplify auto-deploys to prod URL
   - Connects to production backend automatically
   - Uses `poultry` database

### No Manual Configuration Needed!

✅ **You never need to change API URLs manually**
✅ **Environment variables are set automatically**
✅ **No `.env` files in git repository**

### Local Development

For local development, create a `.env.local` file (not committed to git):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Or point to staging:
```env
NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/staging/api/v1
```

### Troubleshooting

If the frontend shows wrong data:

1. Check which backend it's calling in browser DevTools → Network tab
2. Verify the Amplify build logs show the correct API URL
3. Hard refresh browser: `Ctrl + Shift + R`
4. Check AWS Amplify console for build errors
