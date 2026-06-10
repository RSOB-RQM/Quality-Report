// =============================================================================
// Upload API Route — POST /api/upload
// =============================================================================
// Requirements: 10.1, 10.2, 10.6

import { createAuthModule } from '../../../auth/auth';
import { createUploadService } from '../../../services/upload-service';

export async function POST(request: Request): Promise<Response> {
  // 1. Authenticate
  const auth = createAuthModule();
  const user = await auth.getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Verify admin role
  if (user.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Access denied. Only admins can upload data.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // 3. Extract file from FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request. Expected multipart form data.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'Missing file. Please upload an .xlsx file using the "file" field.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // 4. Convert File to Buffer and invoke Upload Service
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadService = createUploadService();
  const result = await uploadService.processUpload(buffer, file.name);

  // 5. Return upload result
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
