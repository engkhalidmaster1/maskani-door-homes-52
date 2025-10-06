# Copilot Instructions for Maskani (Lovable Project)

## Project Overview
- **Architecture:** Vite + React + TypeScript SPA, styled with Tailwind CSS and shadcn-ui. Electron packaging for desktop distribution (see `dist-electron/`, `dist-packaged/`).
- **Main entry:** `src/main.tsx` and `src/App.tsx`.
- **Component organization:** UI components in `src/components/`, assets in `src/assets/`, configuration in `src/config/`, and business logic/services in `src/services/`, `src/lib/`, and `src/hooks/`.
- **Public assets:** Served from `public/`.
- **Electron:** Main process files in `public/` (e.g., `electron-main.cjs`).

## Developer Workflows
- **Install dependencies:** `npm i`
- **Start development:** `npm run dev` (Vite server on port 8081)
- **Electron development:** `npm run electron-dev` (combines web + desktop)
- **Production Electron:** `npm run electron-prod`
- **Build for production:** `npm run build`
- **Package desktop apps:** 
  - Windows: `npm run package-win`
  - macOS: `npm run package-mac` 
  - Linux: `npm run package-linux`
  - All platforms: `npm run dist-all`
- **Legacy Windows scripts:** `run-app.bat` or `start-maskani.bat` for direct packaging

## Key Conventions & Patterns
- **Component pattern:** Functional React components with TypeScript interfaces:
  ```tsx
  interface ComponentProps {
    title: string;
    onAction?: () => void;
  }
  
  export const ComponentName = ({ title, onAction }: ComponentProps) => {
    return <div className="flex items-center p-4">{title}</div>;
  };
  ```
- **State management:** Local state via React hooks; cross-component logic in `src/hooks/` and `src/services/`.
- **File naming:** PascalCase for components (`UserProfile.tsx`), camelCase for utilities (`formatDate.ts`).
- **Styling:** Tailwind utility classes preferred; use `cn()` helper for conditional classes.
- **Type safety:** TypeScript throughout; shared types in `src/types/`, avoid `any` types.
- **API services:** Use async/await pattern with consistent error handling.
- **Integration:** External services integrated via `src/integrations/` and `supabase/` (for backend/data sync).
- **Configuration:** Project-wide config in `src/config/` and root config files (`vite.config.ts`, `tailwind.config.ts`).
- **Icons/Images:** SVG/PNG assets in `public/icons/` and `src/assets/`.

## Special Notes
- **Lovable Platform:** Project can be edited and deployed via [Lovable](https://lovable.dev/projects/c47b9285-b639-4779-b4b9-c710bce96e21). Changes made in Lovable sync to this repo.
- **Custom domain:** Supported via Lovable settings.
- **Electron packaging:** Windows-specific; see `dist-electron/` and `dist-packaged/` for output structure.
- **Documentation:** Multiple README files for different contexts (offline, desktop, AR, etc.).

## Architecture Details
- **UI Framework:** React 18 with functional components and hooks pattern
- **Build System:** Vite for fast HMR, supports TypeScript out-of-the-box
- **Desktop Distribution:** Electron with cross-platform support (Windows/macOS/Linux)
- **Styling System:** Tailwind CSS + shadcn-ui components (check existing components for patterns)
- **Data Layer:** Hybrid approach - Supabase for cloud sync + local JSON storage for offline mode

## Custom Hooks Architecture
- **Authentication:** `useAuth.tsx` - User authentication state
- **Electron Integration:** `useElectronDB.tsx`, `usePropertiesElectron.tsx` 
- **Offline Capabilities:** `useOfflineSync.tsx`, `usePropertiesOffline.tsx`
- **Data Management:** `useProperties.tsx`, `useFavorites.tsx`, `useProfile.tsx`
- **UI State:** `useMobile.tsx`, `useToast.ts`, `useBannerSettings.tsx`
- **Performance:** `useImageCache.tsx`, `useOptimizedImageUpload.tsx`

## Electron Architecture Details
- **Main Process:** `public/electron.cjs` (app lifecycle, window management)
- **Preload Script:** `public/preload.cjs` (secure bridge between processes)  
- **Local Database:** JSON-based storage in `%USERPROFILE%/AppData/Roaming/maskani-desktop/data/`
- **Sync Strategy:** Smart sync between local JSON and Supabase (see `useOfflineSync.tsx`)
- **Port Configuration:** Web dev server on 8081, Electron waits for ready state

## Data Layer & Integrations
- **Backend:** Supabase integration for cloud sync and real-time updates
- **Local Storage:** JSON files for offline functionality (`properties.json`, `favorites.json`)
- **Sync Strategy:** Local-first with cloud backup - full offline functionality
- **Real-time:** Supabase subscriptions for live updates when online
- **Integration:** External services integrated via `src/integrations/` and `supabase/`

## Performance & Platform Support  
- **Web:** Progressive Web App (PWA) with service worker support
- **Desktop:** Cross-platform Electron (Windows/macOS/Linux)
- **Mobile-Responsive:** Tailwind responsive design patterns with `useMobile.tsx`
- **Image Optimization:** `useImageCache.tsx` + `useOptimizedImageUpload.tsx`
- **Bundle Optimization:** Vite's tree shaking + code splitting
- **Offline Mode:** Full app functionality without internet connection

## Common Patterns & Best Practices
- **Component Structure:** Place UI components in `src/components/`, business logic in custom hooks
- **Error Handling:** Use try/catch blocks for async operations, show user-friendly messages
- **Performance:** Lazy load components when needed, optimize images for web and Electron
- **Electron Specifics:** Use `path.join(__dirname, ...)` for cross-platform file paths
- **Tailwind Usage:** Prefer utility classes, use `@apply` sparingly, ensure classes are not purged

## Examples
- **Add a new UI component:** Place in `src/components/`, use Tailwind for styling, export as default.
- **Add a new service:** Place in `src/services/`, use TypeScript, document API shape in `src/types/`.
- **Update Electron main process:** Edit `public/electron.cjs`.
- **Add custom hook:** Create in `src/hooks/useCustomLogic.tsx` with proper TypeScript types.
- **Integrate API:** Add service in `src/services/`, use consistent async/await pattern.

## References
- `README.md` (root): General project info, workflows, and Lovable integration.
- `src/`: Main app source code and structure.
- `dist-electron/`, `dist-packaged/`: Electron build outputs.
- `.bat` files: Windows build/run automation.

---
**For AI agents:** Follow the above conventions, prefer existing patterns, and reference key files for examples. If unsure about a workflow, check the relevant README or script file.
