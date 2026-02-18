import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ApprovalRequestsProvider } from './ApprovalRequestsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApprovalRequestsProvider>
      <App />
    </ApprovalRequestsProvider>
  </StrictMode>,
)
