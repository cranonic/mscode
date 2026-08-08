// api/check-version.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import semver from 'semver';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { id, version } = req.query as { id: string; version: string };
  if (!id || !version) return res.status(400).json({ error: 'Missing id or version.' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    const { data: profile } = await supabase
      .from('publishers')
      .select('publisher_id')
      .eq('id', user.id)
      .single();

    if (!profile) return res.status(403).json({ error: 'Publisher profile not found.' });

    const verifiedPublisherId = profile.publisher_id.toLowerCase().replace(/\s+/g, '-');
    const fullExtensionId = `${verifiedPublisherId}.${id}`;

    const { data } = await supabase
      .from('extensions').select('version').eq('id', fullExtensionId).maybeSingle();

    if (!data) {
      return res.status(200).json({ status: 'new', message: 'New extension.' });
    }
    if (semver.gt(version, data.version)) {
      return res.status(200).json({ status: 'ok', existingVersion: data.version, message: `Valid update from ${data.version}.` });
    }
    return res.status(200).json({ status: 'conflict', existingVersion: data.version, message: `Must be > ${data.version}.` });

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}