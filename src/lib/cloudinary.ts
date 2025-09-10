'use server';

import { v2 as cloudinary } from 'cloudinary';
import type { PdfLink } from './types';

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a PDF file, provided as a Base64 string, to Cloudinary.
 * @param base64Data The Base64 encoded string of the PDF file.
 * @param fileName The original name of the file.
 * @returns A promise that resolves to a PdfLink object containing the secure URL and original file name.
 */
export async function uploadPdfToCloudinary(base64Data: string, fileName: string): Promise<PdfLink> {
  try {
    // Cloudinary requires the data URI format for Base64 uploads
    const dataUri = `data:application/pdf;base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'raw', // Use 'raw' for non-image files like PDFs
      public_id: fileName, // Use original file name as public ID
      access_mode: 'public', // Make the file publicly accessible
      format: 'pdf', // <<< ADICIONADO: Garante que o arquivo seja tratado como PDF
      overwrite: true, // Overwrite if a file with the same name exists
    });

    if (!result.secure_url) {
        throw new Error("O upload para o Cloudinary não retornou uma URL segura.");
    }

    return { url: result.secure_url, name: fileName };
  } catch (error: any) {
    console.error("[Cloudinary Error] Falha ao fazer upload do arquivo:", error);
    // Provide a more user-friendly error message
    const errorMessage = error.message || "Ocorreu um erro desconhecido durante o upload."
    throw new Error(`Falha ao fazer upload do PDF para o Cloudinary: ${errorMessage}`);
  }
}
