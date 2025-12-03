# Daily Check-in Farcaster Frame Mini App

## Overview

A Farcaster Frame v2 mini application that enables users to perform daily on-chain check-ins on the Base blockchain. The app tracks user streaks, manages check-in eligibility based on time windows, and provides a dark-themed, utility-focused interface inspired by modern Web3 applications like Rainbow Wallet and Uniswap.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- React with TypeScript via Vite build system
- Component library: shadcn/ui with Radix UI primitives
- Styling: Tailwind CSS with custom design system
- State management: TanStack React Query for server state

**Design System**
- Dark-first theme using CSS variables for theming
- Typography: DM Sans from Google Fonts
- Custom spacing scale (2, 4, 8, 16 units)
- Component-driven architecture with shadcn/ui as foundation

**Rationale**: Vite provides fast development experience and optimal production builds. shadcn/ui offers accessible, customizable components that can be owned and modified directly in the codebase rather than as external dependencies.

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP server for both API and static file serving
- Development mode uses Vite middleware for HMR
- Production mode serves pre-built static assets

**API Structure**
- RESTful endpoints:
  - `/api/webhook` - Farcaster Frame webhook handler
  - `/api/health` - Health check endpoint
- Minimal backend focused on Frame event handling

**Rationale**: Express provides a lightweight, flexible foundation. The architecture separates concerns between development (Vite dev server) and production (static file serving), enabling rapid iteration while maintaining production simplicity.

### Blockchain Integration

**Web3 Architecture**
- ethers.js v6 for Ethereum interactions
- Target blockchain: Base (Chain ID: 8453)
- Smart contract interaction via ABI interface
- Contract address: 0x8F53eaCb3968F31c4F5FDcaD751c82c1041Aba11

**Key Contract Functions**
- `checkIn()` - Records daily check-in transaction
- `getUserStatus(address)` - Returns user's check-in count, last check-in time, and eligibility

**Wallet Connection**
- Browser-based wallet detection (MetaMask/injected providers)
- Automatic network switching to Base chain
- Session persistence via browser wallet state

**Rationale**: ethers.js is the industry standard for Ethereum interactions with comprehensive TypeScript support. Base chain provides low transaction costs suitable for daily interactions.

### Farcaster Frame Integration

**Frame SDK**
- `@farcaster/frame-sdk` for Frame v2 context and actions
- Frame configuration in `.well-known/farcaster.json`
- Webhook endpoint for Frame interactions
- Ready signal for Frame environment initialization

**Frame Features**
- Single-page mini app experience
- Splash screen configuration
- Button actions integration
- Context-aware initialization (graceful degradation outside Frame environment)

**Rationale**: Frame v2 provides native integration within Farcaster ecosystem, enabling seamless user experience without leaving the social context.

### Data Storage

**Current Implementation**
- In-memory storage via `MemStorage` class
- User data structure with username/password fields
- Interface-based storage abstraction (`IStorage`)

**Database Schema**
- PostgreSQL schema defined in `shared/schema.ts`
- Drizzle ORM for type-safe database operations
- Users table with UUID primary keys

**Migration Path**
- Drizzle Kit configured for PostgreSQL migrations
- Neon Database serverless driver support
- Database URL from environment variables

**Rationale**: In-memory storage allows rapid prototyping. The interface abstraction enables swapping to PostgreSQL without changing business logic. Drizzle provides type-safe queries and automatic schema migrations.

### Build System

**Development**
- Vite dev server with HMR
- React Fast Refresh
- TypeScript type checking
- Path aliases for clean imports

**Production Build**
- Client: Vite builds to `dist/public`
- Server: esbuild bundles to `dist/index.cjs`
- Selective dependency bundling (allowlist approach)
- CommonJS output for Node.js compatibility

**Rationale**: The allowlist bundling strategy reduces filesystem syscalls during cold starts by bundling frequently-used dependencies while keeping Node.js built-ins external. This optimizes serverless deployment scenarios.

### Routing & Navigation

**Client-Side Routing**
- wouter for lightweight routing (< 2KB)
- Hash-based routing for SPA behavior
- Route definitions in `App.tsx`

**Current Routes**
- `/` - Home page with check-in interface
- `*` - 404 Not Found page

**Rationale**: wouter provides React Router-like API with minimal bundle size. For a single-page focused app, this reduces JavaScript overhead.

## External Dependencies

### Third-Party Services

**Blockchain Infrastructure**
- Base Mainnet RPC: `https://mainnet.base.org`
- Block Explorer: BaseScan (`https://basescan.org`)

**Design Resources**
- Google Fonts CDN (DM Sans, Fira Code, Geist Mono, Architects Daughter)

### Smart Contract

**Deployed Contract**
- Address: `0x8F53eaCb3968F31c4F5FDcaD751c82c1041Aba11`
- Network: Base (Chain ID: 8453)
- Functions: Check-in recording and status retrieval

### Farcaster Platform

**Frame Configuration**
- Frame metadata in `.well-known/farcaster.json`
- Webhook integration for Frame events
- SDK initialization for context and actions

### Database (Configured, Not Active)

**Neon Database**
- PostgreSQL serverless database
- Connection via `DATABASE_URL` environment variable
- Drizzle ORM schema defined but not actively used (in-memory storage active)

**Note**: Database infrastructure is configured but the application currently uses in-memory storage. Migration to PostgreSQL requires environment variable configuration and running `npm run db:push`.