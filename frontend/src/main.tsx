import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

const configureAmplify = async (): Promise<void> => {
  try {
    const [{ Amplify }, amplifyOutputsModule] = await Promise.all([
      import('aws-amplify'),
      import('../../amplify_outputs.json')
    ])

    Amplify.configure(amplifyOutputsModule.default)
    console.log('✅ Amplify configured successfully')
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.warn('⚠️ Amplify not available:', error.message)
    console.log('ℹ️ App will run with local data only')
  }
}

void configureAmplify()

// Global error handlers
console.log('🚀 Rodeo Drive CRM starting...')

window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found!')
} else {
  console.log('✅ Root element found, mounting app...')
  
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
    console.log('✅ App mounted successfully')
  } catch (error) {
    console.error('❌ Failed to mount app:', error)
    rootElement.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        flex-direction: column;
        background: #f5f5f5;
        font-family: system-ui, sans-serif;
      ">
        <div style="
          text-align: center;
          padding: 30px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
        ">
          <h1 style="color: #d32f2f; margin-bottom: 10px;">Failed to Load Application</h1>
          <p style="color: #666; margin-bottom: 15px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button onclick="window.location.reload()" style="
            padding: 10px 20px;
            background-color: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">Reload Application</button>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">Check browser console for more details</p>
        </div>
      </div>
    `
  }
}
