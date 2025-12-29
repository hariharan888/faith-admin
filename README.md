# Faith Church Admin Dashboard

Admin dashboard for managing Faith Church operations including members, events, posts, and matrimony profiles.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCT_KEY=your_admin_product_key_here
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3032

## Production Deployment

### Initial Setup (One-time)

1. Copy the production environment template:
```bash
cp env.production.example .env.production
```

2. Edit `.env.production` and fill in your values:
   - `DEPLOY_SERVER_IP`: Your server IP address
   - `DEPLOY_SERVER_USER`: SSH user (usually `ubuntu`)
   - `DEPLOY_SERVER_PATH`: Path on server (e.g., `/home/ubuntu/sites/faith-admin`)
   - `DEPLOY_DOMAIN`: Your domain (e.g., `admin.faithcitychurch.net`)
   - `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
   - `NEXT_PUBLIC_PRODUCT_KEY`: Admin product key from backend

3. Run the setup script to configure infrastructure:
```bash
./scripts/setup-production.sh
```

This will:
- Create nginx container on the kamal network
- Register domain with kamal-proxy for SSL
- Set up the deployment directory

### Deploy

Run the deployment script:
```bash
./scripts/deploy-production.sh
```

This will:
- Build the static SPA
- Upload files to the server
- Restart nginx container
- Verify deployment

## Features

- **Dashboard**: Overview with statistics
- **Members**: Manage church members with CSV import
- **Events**: Manage upcoming and recurring events
- **Posts**: Rich text editor for blog posts
- **Matrimony**: Admin interface for matrimony profiles

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand for state management
- TipTap for rich text editing
- RRULE for recurrence patterns

