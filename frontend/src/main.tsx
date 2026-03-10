import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx';
import { UserProvider } from './context/UserContext.tsx';

/**
 * Entry point del frontend.
 *
 * L'ordre dels providers és rellevant:
 * - `UserProvider`: identitat/sessió global.
 * - `SettingsProvider`: configuració i tema depenents de context d'usuari.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </UserProvider>
  </StrictMode>,
)
