
# TruLuv - AI Companion Platform

A modern SaaS AI Companion platform built with Next.js 20, React, Tailwind CSS, Prisma, and Stripe integration.

## Features

- **AI Companions**: Create and interact with AI companions with unique personalities and appearances
- **Image Generation**: Generate companion avatars using advanced image models
- **Voice Capabilities**: Voice conversations with companions using various voice models
- **Subscription System**: Stripe monthly subscription with token-based usage
- **NSFW Content Support**: Toggle for NSFW content and companions
- **Multi-Model Support**: Integration with different AI models for varied experiences
- **User Authentication**: Clerk authentication with multiple sign-in options
- **Responsive Design**: Full mobile and desktop responsiveness with Tailwind CSS
- **Tag-Based Categorization**: Find companions by tags and categories
- **Chat History**: Save and manage conversation history
- **Modern UI**: Clean interface with dark/light mode support

## Tech Stack

- **Frontend**: Next.js 20, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Clerk
- **Payments**: Stripe
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI Integration**: Modal API for AI processing
- **Media**: Cloudinary for image storage
- **Analytics**: Google Analytics integration

## Prerequisites

- Node.js version 20.x or higher
- PostgreSQL database
- Clerk account for authentication
- Stripe account for payments
- Cloudinary account for image uploads
- Modal account for AI processing

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard


# Database
DATABASE_URL=

# Stripe
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# Modal
MODAL_AGENT_BASE_URL=
MODAL_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS=

# Other services
STEAMSHIP_API_KEY=
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   npx prisma db push
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the development server on port 3000 |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint to check code quality |
| `npm run postinstall` | Generates Prisma client |

## License

This project is licensed under the terms specified in the LICENSE file.
