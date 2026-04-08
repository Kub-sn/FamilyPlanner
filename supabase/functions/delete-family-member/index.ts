// @ts-nocheck
export {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const memberUserId = String(body?.memberUserId ?? '').trim();

    if (!familyId || !memberUserId) {
      return jsonResponse(400, {
        error: 'familyId and memberUserId are required.',
      });
    }

    if (memberUserId === user.id) {
      return jsonResponse(400, {
        error: 'Dein eigenes Konto kannst du hier nicht loeschen.',
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
        error: 'Nur Admins duerfen Mitgliederkonten loeschen.',
      });
    }

    const { data: family, error: familyError } = await adminClient
      .from('families')
      .select('id, owner_user_id')
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

    if (String(family.owner_user_id) === memberUserId) {
      return jsonResponse(400, {
        error: 'Der Familiengruender kann nur ueber die Familienloeschung entfernt werden.',
      });
    }

    const { data: membership, error: membershipError } = await adminClient
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId)
      .eq('user_id', memberUserId)
      .maybeSingle();

    if (membershipError) {
      return jsonResponse(500, {
        error: 'Die Mitgliedschaft konnte nicht geprueft werden.',
        details: membershipError.message,
      });
    }

    if (!membership) {
      return jsonResponse(404, {
        error: 'Das Mitglied wurde in dieser Familie nicht gefunden.',
      });
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(memberUserId, true);

    if (deleteError) {
      return jsonResponse(500, {
        error: 'Das Mitgliedskonto konnte nicht geloescht werden.',
        details: deleteError.message,
      });
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    return jsonResponse(500, {
      error: 'The family member could not be deleted.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
