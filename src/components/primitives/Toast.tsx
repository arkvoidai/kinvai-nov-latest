import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { KINVAI_SPRING, useReducedMotion } from '../../lib/motion';

export type ToastTone = 'default' | 'success' | 'error';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  undoLabel?: string;
  onUndo?: () => void;
  durationMs?: number;
}

interface ToastRecord extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record: ToastRecord = { ...input, id };
      setToasts((prev) => [...prev.slice(-3), record]);

      const duration = input.durationMs ?? (input.onUndo ? 6000 : 4200);
      const timer = window.setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 left-4 md:left-auto z-[var(--z-toast)] flex flex-col gap-2.5 md:w-[390px] pointer-events-none pb-[env(safe-area-inset-bottom,0px)]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon =
              item.tone === 'success'
                ? CheckCircle2
                : item.tone === 'error'
                  ? AlertCircle
                  : Info;
            const iconColor =
              item.tone === 'success'
                ? 'text-success'
                : item.tone === 'error'
                  ? 'text-error'
                  : 'text-ink-on-dark';

            return (
              <motion.div
                key={item.id}
                role="status"
                layout={!reduced}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
                transition={reduced ? { duration: 0.01 } : KINVAI_SPRING}
                className="pointer-events-auto flex items-center gap-3 rounded-[20px] bg-ink text-ink-on-dark px-4 py-3.5 shadow-[var(--shadow-float)] border border-white/10"
              >
                <Icon size={20} strokeWidth={1.75} className={`shrink-0 ${iconColor}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-on-dark">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-ink-on-dark-muted mt-0.5">{item.description}</p>
                  )}
                </div>
                {item.onUndo && (
                  <button
                    type="button"
                    onClick={() => {
                      item.onUndo?.();
                      dismiss(item.id);
                    }}
                    className="rounded-full bg-white/14 hover:bg-white/24 text-white text-xs font-medium px-3 py-1.5 min-h-[32px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {item.undoLabel || 'Undo'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-on-dark-muted hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                >
                  <X size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}
