# Nutrition Tracker Application

## Overview

This is a full-stack nutrition tracking application built with React (frontend) and Express.js (backend). The app allows users to log food entries, analyze nutritional content using AI, and track their daily nutrition goals. It features a modern UI built with shadcn/ui components and Tailwind CSS, with AI-powered food analysis using Google's Gemini API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a traditional client-server architecture with a clear separation between frontend and backend:

- **Frontend**: React SPA with TypeScript, built with Vite
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini API for food analysis
- **Styling**: Tailwind CSS with shadcn/ui component library

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui (Radix UI primitives with Tailwind styling)
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **AI Service**: Google Gemini API for food description analysis
- **Session Management**: Configured for PostgreSQL sessions
- **API Design**: RESTful endpoints with JSON responses

### Database Schema
The application uses three main tables:
- **users**: Basic user authentication (id, username, password)
- **food_entries**: Daily food logs with nutritional data (calories, carbs, protein, fat)
- **daily_goals**: User's nutritional targets

### Key Features
- AI-powered food analysis using natural language descriptions
- Daily nutrition tracking with progress visualization
- Real-time nutritional data calculation
- Responsive design with mobile support
- Form validation with comprehensive error handling

## Data Flow

1. **Food Entry Process**:
   - User enters food description in natural language
   - Frontend sends description to `/api/food/analyze` endpoint
   - Backend calls Gemini API to extract nutritional information
   - Parsed nutrition data is returned to frontend
   - User can review and save the entry
   - Entry is stored in database with today's date

2. **Daily Tracking**:
   - Frontend fetches today's entries from `/api/food/entries/today`
   - Progress bars show current vs. target nutrition values
   - Real-time updates as new entries are added

3. **State Management**:
   - TanStack Query manages server state and caching
   - Form state handled by React Hook Form
   - UI state managed through React hooks

## External Dependencies

### AI Integration
- **Google Gemini API**: Analyzes food descriptions and returns structured nutritional data
- Requires `GEMINI_API_KEY` environment variable
- Uses structured output with JSON schema validation

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- Requires `DATABASE_URL` environment variable
- Drizzle ORM handles migrations and queries

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Development
- Frontend served by Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database migrations handled by Drizzle Kit
- Environment variables loaded from `.env` file

### Production Build
- Frontend builds to static assets in `dist/public`
- Backend bundles with esbuild to `dist/index.js`
- Single server serves both API and static files
- Database migrations applied via `npm run db:push`

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `NODE_ENV`: Environment setting (development/production)

The application is structured to be easily deployable to platforms like Railway, Vercel, or traditional hosting with Node.js support.