# Maskani - Real Estate Management System

A modern, responsive real estate management application built with React, TypeScript, and Supabase.

## 🚀 Features

- **Modern PWA**: Installable web app with offline support
- **Real-time Analytics**: Google Analytics integration
- **Responsive Design**: Mobile-first with RTL Arabic support
- **Offline Capability**: Works without internet connection
- **Cross-platform**: Web and desktop (Electron) support
- **Comprehensive Testing**: Vitest with React Testing Library
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Desktop**: Electron
- **Testing**: Vitest + React Testing Library
- **Analytics**: Google Analytics 4
- **PWA**: Workbox + Service Worker

## 📋 Prerequisites

- Node.js 18+
- npm or bun
- Supabase account
- Google Analytics account (optional)

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd maskani

# Install dependencies
npm install
```

### Environment Setup

1. Copy environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Configure your environment variables in `.env.local`:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_ANALYTICS_ID=your_ga_measurement_id
   VITE_APP_ENV=development
   ```

### Development

```bash
# Start development server (port 8081)
npm run dev

# Start Electron development
npm run electron-dev

# Run tests
npm run test

# Run linting
npm run lint
```

### Production Build

```bash
# Build for web
npm run build

# Preview production build
npm run preview

# Build and package for desktop
npm run dist-all
```

## 🧪 Testing

```bash
# Run all tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Quality check (type-check + lint + test)
npm run quality-check
```

## 📱 PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Core functionality works offline
- **Background Sync**: Automatic data synchronization
- **Push Notifications**: Real-time updates (future feature)

## 🔧 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run type-check` | TypeScript type checking |
| `npm run electron-dev` | Start Electron development |
| `npm run dist-all` | Build for all platforms |

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utilities and configurations
├── pages/              # Application pages/routes
└── types/              # TypeScript type definitions

public/                 # Static assets
├── sw.js              # Service worker
├── manifest.json      # PWA manifest
└── offline.html       # Offline fallback page
```

## 🚀 Deployment

### Web Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting provider

### Desktop Deployment

```bash
# Windows
npm run package-win

# macOS
npm run package-mac

# Linux
npm run package-linux

# All platforms
npm run dist-all
```

## 🔒 Security

- Row Level Security (RLS) enabled on all database tables
- Secure authentication with Supabase Auth
- Content Security Policy (CSP) headers
- Environment variables for sensitive data

## 📊 Analytics

Google Analytics 4 is integrated for:

- Page views and user interactions
- Performance monitoring
- Custom event tracking
- Real-time user analytics

## 🐛 Troubleshooting

### Common Issues

1. **Build fails**: Ensure all environment variables are set
2. **Tests fail**: Check Supabase connection and test mocks
3. **PWA not working**: Verify service worker registration
4. **Analytics not tracking**: Check GA measurement ID

### Debug Commands

```bash
# Clear cache and rebuild
npm run clean && npm install && npm run build

# Check environment
npm run type-check

# Full quality check
npm run ci
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run quality-check`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

Built with ❤️ using modern web technologies
