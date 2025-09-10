import { NextResponse } from 'next/server';
import { uploadPdfToDrive } from '@/lib/google-api';
import type { PdfLink } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      return uploadPdfToDrive(fileBuffer, file.name);
    });

    const uploadedLinks: PdfLink[] = await Promise.all(uploadPromises);

    return NextResponse.json(uploadedLinks, { status: 200 });
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Erro desconhecido no servidor.';
    console.error('[API UPLOAD ERROR]', error);
    return NextResponse.json({ error: `Falha no upload: ${errorMessage}` }, { status: 500 });
  }
}
