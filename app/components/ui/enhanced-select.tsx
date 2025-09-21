
'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface EnhancedSelectProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  required,
  placeholder = "Selecciona una opción",
  hint,
  error,
  children,
  value,
  onValueChange,
  disabled,
  className
}) => {
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <Label 
          htmlFor={selectId} 
          className={cn("input-label", required && "required-field")}
        >
          {label}
        </Label>
      )}
      
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          id={selectId}
          className={cn(
            "user-input",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <SelectValue 
            placeholder={
              <span className="system-text">
                {placeholder}
              </span>
            } 
          />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      
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
};

export default EnhancedSelect;
