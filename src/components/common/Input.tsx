import React from 'react';
import { clsx } from 'clsx';
import { InputProps } from '../../types';

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText,
  className = '',
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  ...props 
}) => {
  // Debug logging for react-hook-form registration
  if ((props as any).name === 'email' || (props as any).name === 'password' || (props as any).name === 'matrixName') {
    console.log('Input component received props:', {
      name: (props as any).name,
      ref: !!(props as any).ref,
      onChange: !!(props as any).onChange,
      onBlur: !!(props as any).onBlur,
      value: (props as any).value,
      hasRegisterProps: !!((props as any).ref && (props as any).onChange && (props as any).onBlur)
    });
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold focus:border-transparent transition-colors duration-200',
          error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-300',
          className
        )}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        required={required}
        {...props}
      />
      {(error || helperText) && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input; 