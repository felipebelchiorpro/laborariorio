import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a string by converting to lowercase and removing diacritics (accents).
 * @param text The text to normalize.
 * @returns The normalized text.
 */
export function normalizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  return text
    .normalize('NFD') // Decompose combined graphemes into base characters and diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase();
}
