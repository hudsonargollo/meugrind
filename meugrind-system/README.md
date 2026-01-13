# MEUGRIND Productivity System

An offline-first Progressive Web Application designed for multi-hyphenate creative professionals operating from rural locations with intermittent internet connectivity.

## Features

- **Offline-First Architecture**: Full functionality without internet connection
- **Progressive Web App**: Installable on iOS, Android, and Desktop
- **Role-Based Access**: Manager and Personal account types
- **Dynamic Interface**: Adapts to context and device capabilities
- **Multi-Module System**:
  - 🎵 Band Management (setlists, tech riders, crew coordination)
  - 📱 Influencer CRM (brand deals, content pipeline)
  - ☀️ Solar Business (lead management, project tracking)
  - 🍅 Pomodoro Timer (focus management, productivity tracking)
  - 📺 PR Management (appearance windows, talking points)

## Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS + Shadcn/UI
- **Local Database**: IndexedDB with Dexie.js
- **State Management**: Zustand + TanStack Query
- **PWA**: next-pwa with Workbox
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── modules/            # Feature modules
│   ├── auth/           # Authentication
│   ├── band/           # Band management
│   ├── core/           # Core system features
│   ├── influencer/     # Influencer CRM
│   ├── pomodoro/       # Pomodoro timer
│   └── solar/          # Solar business CRM
├── stores/             # Zustand stores
└── types/              # TypeScript type definitions
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Development Guidelines

- **Offline-First**: All features must work without internet
- **Progressive Enhancement**: Core functionality offline, enhanced features online
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Sub-200ms response times for local operations

## Architecture Principles

1. **Local-First Data Storage**: Primary data lives on client device
2. **Optimistic UI Updates**: Immediate rendering before persistence
3. **Background Synchronization**: Delta sync with conflict resolution
4. **Role-Based Security**: Manager vs Personal account permissions
5. **Context-Aware Interface**: Adapts to mode, device, and connectivity

## Next Steps

This foundation provides:
- ✅ Next.js 14 project with TypeScript
- ✅ PWA configuration with offline support
- ✅ Tailwind CSS + Shadcn/UI setup
- ✅ Project structure with module organization
- ✅ Core type definitions
- ✅ Basic responsive homepage

Ready for implementation of:
- [ ] Offline-first data layer with IndexedDB
- [ ] Authentication and role management
- [ ] Individual module implementations
- [ ] Sync and conflict resolution
- [ ] Performance optimizations