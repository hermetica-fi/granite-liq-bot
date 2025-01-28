import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';

fetch(`${API_BASE}`).then(r => r.json()).then(console.log)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
