import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const isEmpty = props.value === '' && !props.defaultValue;
    const showFloatingLabel = isFocused || !isEmpty;

    return (
      <div className="space-y-1">
        <div className="relative">
          {label && (
            <label 
              htmlFor={props.id} 
              className={cn(
                "absolute text-sm transition-all duration-200 pointer-events-none left-3 z-10",
                showFloatingLabel 
                  ? "top-0 -translate-y-5 text-xs text-primary-600" 
                  : "top-1/2 -translate-y-1/2 text-gray-500"
              )}
            >
              {label}
            </label>
          )}
          <input
            type={type}
            className={cn(
              'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 leading-10',
              error ? 'border-red-500 focus:ring-red-500' : '',
              className
            )}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input }; 