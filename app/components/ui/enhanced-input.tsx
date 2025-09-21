
'use client';

import React from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  example?: string;
  hint?: string;
  error?: string;
  variant?: 'user' | 'system';
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, label, required, example, hint, error, variant = 'user', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={inputId} 
            className={cn("input-label", required && "required-field")}
          >
            {label}
          </Label>
        )}
        
        <Input
          id={inputId}
          ref={ref}
          className={cn(
            "user-input",
            variant === 'system' && "system-example",
            error && "border-destructive focus:border-destructive",
            className
          )}
          placeholder={example ? `Ej: ${example}` : props.placeholder}
          {...props}
        />
        
        {hint && (
          <p className="example-hint">
            💡 {hint}
          </p>
        )}
        
        {error && (
          <p className="text-destructive text-sm font-medium">
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export default EnhancedInput;
