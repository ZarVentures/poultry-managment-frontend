# How Dynamic Environment Configuration Works

## The Magic: AWS_BRANCH Variable

AWS Amplify automatically provides an environment variable called `AWS_BRANCH` during the build process. This variable contains the name of the git branch being deployed.

## Step-by-Step Flow

### When You Push to Staging Branch:

```
1. You push code to staging branch
   ↓
2. AWS Amplify detects the push
   ↓
3. Amplify starts build process
   ↓
4. Amplify sets AWS_BRANCH = "staging"
   ↓
5. amplify.yml preBuild phase runs:
   
   if [ "${AWS_BRANCH}" = "staging" ]; then
     echo "NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/staging/api/v1" > .env.production
   fi
   
   ↓
6. Creates .env.production file with STAGING API URL
   ↓
7. npm run build uses this .env.production
   ↓
8. Frontend is built with STAGING backend URL
   ↓
9. Deployed to: staging.d3woglqf7depd.amplifyapp.com
   ↓
10. Frontend calls: https://13.234.140.190.nip.io/staging/api/v1
    ↓
11. Backend uses: poultry_stage database
```

### When You Push to Prod Branch:

```
1. You push code to prod branch
   ↓
2. AWS Amplify detects the push
   ↓
3. Amplify starts build process
   ↓
4. Amplify sets AWS_BRANCH = "prod"
   ↓
5. amplify.yml preBuild phase runs:
   
   else
     echo "NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/api/v1" > .env.production
   fi
   
   ↓
6. Creates .env.production file with PRODUCTION API URL
   ↓
7. npm run build uses this .env.production
   ↓
8. Frontend is built with PRODUCTION backend URL
   ↓
9. Deployed to: prod.d3woglqf7depd.amplifyapp.com
   ↓
10. Frontend calls: https://13.234.140.190.nip.io/api/v1
    ↓
11. Backend uses: poultry database
```

## The Key Code Explained

```yaml
preBuild:
  commands:
    - npm ci  # Install dependencies
    - |       # Multi-line shell script starts here
      # Check which branch is being deployed
      if [ "${AWS_BRANCH}" = "staging" ]; then
        # If staging branch, create .env.production with STAGING API
        echo "NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/staging/api/v1" > .env.production
        echo "✅ Using STAGING backend API"
      else
        # If any other branch (prod), create .env.production with PROD API
        echo "NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/api/v1" > .env.production
        echo "✅ Using PRODUCTION backend API"
      fi
      # Show the created file in build logs
      cat .env.production
```

## Why .env.production?

Next.js reads `.env.production` file during production builds (`npm run build`). By creating this file dynamically before the build, we inject the correct API URL.

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   staging    │              │     prod     │            │
│  │   branch     │              │    branch    │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼──────────────────┘
          │                              │
          │ git push                     │ git push
          ↓                              ↓
┌─────────────────────┐        ┌─────────────────────┐
│  AWS Amplify        │        │  AWS Amplify        │
│  (Staging Build)    │        │  (Prod Build)       │
│                     │        │                     │
│  AWS_BRANCH="staging"│       │  AWS_BRANCH="prod"  │
│         ↓           │        │         ↓           │
│  amplify.yml runs   │        │  amplify.yml runs   │
│         ↓           │        │         ↓           │
│  Creates .env with  │        │  Creates .env with  │
│  STAGING API URL    │        │  PROD API URL       │
│         ↓           │        │         ↓           │
│  npm run build      │        │  npm run build      │
│         ↓           │        │         ↓           │
│  Deploy to:         │        │  Deploy to:         │
│  staging.amplify... │        │  prod.amplify...    │
└─────────┬───────────┘        └─────────┬───────────┘
          │                              │
          │ API calls                    │ API calls
          ↓                              ↓
┌─────────────────────┐        ┌─────────────────────┐
│  EC2 Backend        │        │  EC2 Backend        │
│  Port: 3002         │        │  Port: 3001         │
│  /staging/api/v1    │        │  /api/v1            │
│         ↓           │        │         ↓           │
│  poultry_stage DB   │        │  poultry DB         │
└─────────────────────┘        └─────────────────────┘
```

## Benefits

✅ **Zero Manual Configuration**: No need to change anything when promoting staging to prod
✅ **No Secrets in Git**: API URLs are generated during build, not stored in repo
✅ **Branch-Specific**: Each branch automatically gets the right configuration
✅ **Same Codebase**: Staging and prod use identical code, only config differs
✅ **Easy Promotion**: `git merge staging` into prod automatically works

## Verification

After deployment, check the Amplify build logs. You'll see:

**For Staging:**
```
✅ Using STAGING backend API
NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/staging/api/v1
```

**For Prod:**
```
✅ Using PRODUCTION backend API
NEXT_PUBLIC_API_URL=https://13.234.140.190.nip.io/api/v1
```

## Testing

Open browser DevTools → Network tab → Check API calls:

- **Staging site** should call: `https://13.234.140.190.nip.io/staging/api/v1/...`
- **Prod site** should call: `https://13.234.140.190.nip.io/api/v1/...`
