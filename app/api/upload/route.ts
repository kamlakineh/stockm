import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

function getUploadThingApi() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token || !token.trim()) return null;
  try {
    return new UTApi({ token: token.trim() });
  } catch (e) {
    console.error('Failed to initialize UTApi:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const utApi = getUploadThingApi();
    if (utApi) {
      const response = await utApi.uploadFiles(file);
      if (response.data && response.data.url) {
        return NextResponse.json({
          success: true,
          url: response.data.url,
          source: 'uploadthing'
        });
      }
    }

    // Fallback if UploadThing token is not set or failed: return Data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      source: 'local_data_url'
    });
  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
