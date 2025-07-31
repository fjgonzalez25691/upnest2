import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from 'react-oidc-context'
// Importing styles and main App component
import './index.css'
import 'react-datepicker/dist/react-datepicker.css';
// Importing the main App component
import App from './App.jsx'

// Importing the Cognito configuration
import { cognitoConfig } from './auth/cognitoConfig.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Wrapping the App component with BrowserRouter for routing */}
      <AuthProvider
        {...cognitoConfig}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
