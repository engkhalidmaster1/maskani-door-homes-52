import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAnalytics } from './hooks/useAnalytics'

// Initialize analytics in production only
if (import.meta.env.PROD) {
  initAnalytics();
}

createRoot(document.getElementById("root")!).render(<App />);
