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

