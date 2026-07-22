import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 28, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <path 
        d="M6 4H15C20.5228 4 25 8.47715 25 14C25 19.5228 20.5228 24 15 24H6V4Z" 
        fill="#c8f542" 
      />
    </svg>
  );
};

export default Logo;
