import React from 'react';
import { formatPhone, unformatPhone } from '../lib/formatters';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ 
  value, 
  onChange, 
  placeholder = '(00) 00000-0000',
  className = '',
  required = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbers = unformatPhone(input);
    
    // Limita a 11 dígitos (celular brasileiro)
    if (numbers.length <= 11) {
      onChange(numbers);
    }
  };

  return (
    <input
      type="tel"
      value={formatPhone(value)}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  );
};

export default PhoneInput;
