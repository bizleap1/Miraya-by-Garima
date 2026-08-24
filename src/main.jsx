import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { LoadingProvider } from './context/LoadingContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LoadingProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </WishlistProvider>
      </LoadingProvider>
    </BrowserRouter>
  </StrictMode>,
)
