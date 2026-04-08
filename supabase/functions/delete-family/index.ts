// @ts-nocheck
export {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOCUMENT_BUCKET = 'family-documents';
const STORAGE_REMOVE_BATCH_SIZE = 100;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

async function createClients(authorization: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Supabase function configuration is incomplete.');
  }

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');

  return {
    callerClient: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    }),
    adminClient: createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

async function removeFamilyDocumentFiles(adminClient: any, familyId: string) {
  const { data: documents, error: documentsError } = await adminClient
    .from('documents')
    .select('file_path')
    .eq('family_id', familyId)
    .not('file_path', 'is', null);

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  const filePaths = Array.from(
    new Set(
      (documents ?? [])
        .map((document: { file_path: string | null }) => String(document.file_path ?? '').trim())
        .filter(Boolean),
    ),
  );

  for (let index = 0; index < filePaths.length; index += STORAGE_REMOVE_BATCH_SIZE) {
    const currentBatch = filePaths.slice(index, index + STORAGE_REMOVE_BATCH_SIZE);
    const { error: storageError } = await adminClient.storage
      .from(DOCUMENT_BUCKET)
      .remove(currentBatch);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const authorization = request.headers.get('Authorization');

  if (!authorization) {
    return jsonResponse(401, { error: 'Unauthorized.' });
  }

  try {
    const { callerClient, adminClient } = await createClients(authorization);
    const {
      data: { user },
      error: authError,
    } = await callerClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, { error: 'Unauthorized.' });
    }

    const body = await request.json().catch(() => ({}));
    const familyId = String(body?.familyId ?? '').trim();

    if (!familyId) {
      return jsonResponse(400, {
        error: 'familyId is required.',
      });
    }

    const { data: currentProfile, error: currentProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfileError) {
      return jsonResponse(500, {
        error: 'Admin permissions could not be checked.',
        details: currentProfileError.message,
      });
    }

    if (!currentProfile || currentProfile.role !== 'admin') {
      return jsonResponse(403, {
        error: 'Nur Admins duerfen Familien loeschen.',
      });
    }

    const { data: family, error: familyError } = await adminClient
      .from('families')
      .select('id')
      .eq('id', familyId)
      .maybeSingle();

    if (familyError) {
      return jsonResponse(500, {
        error: 'The family could not be loaded.',
        details: familyError.message,
      });
    }

    if (!family) {
      return jsonResponse(404, {
        error: 'Die Familie wurde nicht gefunden.',
      });
    }

    await removeFamilyDocumentFiles(adminClient, familyId);

    const { error: deleteError } = await adminClient
      .from('families')
      .delete()
      .eq('id', familyId);

    if (deleteError) {
      return jsonResponse(500, {
        error: 'Die Familie konnte nicht geloescht werden.',
        details: deleteError.message,
      });
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    return jsonResponse(500, {
      error: 'The family could not be deleted.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
