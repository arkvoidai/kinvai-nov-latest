import {
  forwardRef,
  useId,
  type FormEvent,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = '', ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const descId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={descId}
        className={`w-full min-h-[44px] rounded-[14px] bg-surface px-4 py-2.5 text-base text-ink placeholder:text-ink-3 border transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-0 disabled:opacity-50 disabled:bg-stone ${
          error
            ? 'border-error focus-visible:outline-error'
            : 'border-line hover:border-line-strong focus:border-ink'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface SearchPillProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Promax-inspired wide pill search input with dark round submit button.
 */
export function SearchPill({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search systems, spreadsheets, worlds…',
  ariaLabel = 'Search Kinvai products',
  compact = false,
  className = '',
}: SearchPillProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`flex items-center w-full rounded-full bg-surface border border-line hover:border-line-strong focus-within:border-ink focus-within:ring-2 focus-within:ring-brand/25 transition-all pl-4 pr-1.5 ${
        compact ? 'h-11' : 'h-12'
      } ${className}`}
    >
      <Search size={18} strokeWidth={1.75} className="text-ink-3 shrink-0 mr-2.5" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full min-w-0 bg-transparent text-base md:text-[15px] text-ink placeholder:text-ink-3 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search query"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-2 hover:text-ink hover:bg-stone transition-colors shrink-0 mr-1 cursor-pointer"
        >
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        aria-label="Submit search"
        className={`inline-flex items-center justify-center rounded-full bg-ink text-white hover:bg-ink-soft kv-press shrink-0 cursor-pointer ${
          compact ? 'w-8 h-8' : 'w-9 h-9'
        }`}
      >
        <Search size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, hint, error, id, className = '', ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  const descId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={descId}
          className={`w-full min-h-[44px] appearance-none rounded-[14px] bg-surface pl-4 pr-10 py-2.5 text-base text-ink border transition-colors cursor-pointer disabled:opacity-50 disabled:bg-stone ${
            error
              ? 'border-error'
              : 'border-line hover:border-line-strong focus:border-ink'
          } ${className}`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2"
        />
      </div>
      {error ? (
        <p id={`${selectId}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-sm text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, id, className = '', checked, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-start gap-3 min-h-[44px] py-2 cursor-pointer select-none ${
        rest.disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <span className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...rest}
        />
        <span className="w-5 h-5 rounded-[6px] border border-line-strong bg-surface peer-checked:bg-ink peer-checked:border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-2 transition-colors flex items-center justify-center">
          <Check
            size={14}
            strokeWidth={2.5}
            aria-hidden="true"
            className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          />
        </span>
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium text-ink leading-snug">{label}</span>
        {description && <span className="text-sm text-ink-2 mt-0.5">{description}</span>}
      </span>
    </label>
  );
});
