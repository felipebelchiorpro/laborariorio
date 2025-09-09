import * as React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="100"
      height="100"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo da Prefeitura"
    >
      {/*
        POR FAVOR, SUBSTITUA ESTE CONTEÚDO 
        PELO CÓDIGO DO SEU PRÓPRIO ARQUIVO SVG.
      */}
      <path
        d="M12 2L3 6.5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6.5L12 2ZM12 4.15L18 7.3V11C18 15.45 15.44 19.54 12 20.82C8.56 19.54 6 15.45 6 11V7.3L12 4.15ZM12 7V12H15V14H12V17H10V14H7V12H10V7H12Z"
        fill="currentColor"
      />
    </svg>
  );
}
