import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getRootElement } from './app/get-root-element'

const rootElement = getRootElement()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
