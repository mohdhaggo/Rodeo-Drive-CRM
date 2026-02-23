import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ApprovalRequestsProvider } from './ApprovalRequestsContext.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ApprovalRequestsProvider>
        <App />
      </ApprovalRequestsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
