// src/components/logo.tsx
import React from 'react';

export function Logo() {
  // POR FAVOR, SUBSTITUA O CONTEÚDO DESTE SVG ABAIXO
  // PELO CÓDIGO DO SEU PRÓPRIO ARQUIVO SVG.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-24 w-24 object-contain text-muted-foreground"
    >
      {/* Exemplo de SVG - Cole o seu código aqui dentro */}
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
      <path d="M2 17l10 5 10-5"></path>
      <path d="M2 12l10 5 10-5"></path>
    </svg>
  );
}
