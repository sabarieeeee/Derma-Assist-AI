/// <reference types="vite/client" />

// 1. Fix for: Property 'iconify-icon' does not exist on type 'JSX.IntrinsicElements'
declare namespace JSX {
  interface IntrinsicElements {
    'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      icon: string;
      width?: string | number;
      height?: string | number;
      style?: React.CSSProperties;
      className?: string;
    };
  }
}

// 2. Fix for: Property 'env' does not exist on type 'ImportMeta'
interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string;
  // Add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}