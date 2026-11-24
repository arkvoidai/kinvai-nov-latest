import { MotionConfig } from 'motion/react';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ToastProvider } from './components/primitives';
import { AuthProvider } from './lib/auth/AuthProvider';
import { CartProvider } from './lib/cart/CartProvider';

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
