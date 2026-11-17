import React from 'react';

interface NevaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  useImage?: boolean;
}

export const NevaLogo: React.FC<NevaLogoProps> = ({
  className = '',
  size = 'md',
  useImage = true,
}) => {
  const sizeClasses = {
    sm: 'h-5',
    md: 'h-7',
    lg: 'h-9',
    xl: 'h-12',
  };

  const [imgError, setImgError] = React.useState(false);

  if (useImage && !imgError) {
    return (
      <img
        src="/images/neva_logo.png"
        alt="NEVA"
        className={`object-contain w-auto select-none ${sizeClasses[size]} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Pure SVG vector geometric rendition of NEVA
  return (
    <svg
      viewBox="0 0 170 38"
      fill="currentColor"
      className={`${sizeClasses[size]} w-auto ${className}`}
      aria-label="NEVA"
    >
      {/* Letter N */}
      <path d="M 6 4 L 16 4 L 34 27 L 34 4 L 43 4 L 43 34 L 33 34 L 15 11 L 15 34 L 6 34 Z" />
      
      {/* Letter E (three horizontal bars) */}
      <rect x="52" y="4" width="32" height="7.5" rx="0.5" />
      <rect x="52" y="15.25" width="28" height="7.5" rx="0.5" />
      <rect x="52" y="26.5" width="32" height="7.5" rx="0.5" />
      
      {/* Letter V */}
      <path d="M 94 4 L 103 4 L 115 28 L 127 4 L 136 4 L 120 34 L 110 34 Z" />
      
      {/* Letter A */}
      <path d="M 152 4 L 161 4 L 176 34 L 167 34 L 163 24 L 150 24 L 146 34 L 137 34 Z M 153.5 16 L 159.5 16 L 156.5 9 Z" />
    </svg>
  );
};
