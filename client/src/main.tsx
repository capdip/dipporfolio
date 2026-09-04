import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getAnimationController } from './animations'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

// Initialize animations after DOM is ready
if (typeof window !== 'undefined') {
  // Initialize GSAP ScrollTrigger and animation controller
  const animationController = getAnimationController()
  
  // Initialize animations after a short delay to ensure DOM is ready
  setTimeout(() => {
    animationController.initialize()
  }, 100)
}
