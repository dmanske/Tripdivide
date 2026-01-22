
import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white',
    outline: 'bg-transparent border border-indigo-500/50 hover:border-indigo-500 text-indigo-400'
  };

  return (
    <button className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Fixed Badge to accept className
export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'gray', className = '' }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[color]} ${className}`}>{children}</span>;
};

// Fixed Card to extend HTMLAttributes to support onClick and other standard div props
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title, ...props }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${className}`} {...props}>
    {title && <div className="px-6 py-4 border-b border-gray-800 font-semibold text-gray-300">{title}</div>}
    <div className="p-6">{children}</div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Changed props type to any to allow rows and other attributes when used as textarea or select
export const Input: React.FC<any & { label?: string; error?: string; as?: 'input' | 'select' | 'textarea' }> = ({ label, error, as = 'input', className = '', ...props }) => {
  const Component = as as any;
  const baseClass = "w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-600";
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-400">{label}</label>}
      <Component className={`${baseClass} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
