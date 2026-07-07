import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={clsx(
            'input-field',
            error && 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
