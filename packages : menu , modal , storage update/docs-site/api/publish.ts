// docs-site/api/publish.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import JSZip from 'jszip';

// Formidable √  Vercel parse x
export const config = {
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Token Extraction & Verification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer msce_')) {
      return res.status(401).json({ error: 'Missing or invalid Personal Access Token.' });
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: tokenRecord, error: tokenErr } = await supabase
      .from('publisher_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenRecord) {
      return res.status(401).json({ error: 'Invalid or revoked token.' });
    }

    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({ error: 'This token has expired.' });
    }

    // Fetch actual Publisher Profile
    const { data: profile } = await supabase
      .from('publishers')
      .select('publisher_id, display_name')
      .eq('id', tokenRecord.user_id)
      .single();

    if (!profile || !profile.publisher_id) {
      return res.status(403).json({ error: 'Publisher profile incomplete. Please set your Publisher ID in the dashboard.' });
    }

    // 2. Parse File Upload
    const form = formidable({ keepExtensions: true });
    const [fields, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file detected in upload payload.' });
    }

    // 3. Extract & Validate Manifest
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const zip = await JSZip.loadAsync(fileBuffer);
    const manifestFile = zip.file('manifest.json');
    
    if (!manifestFile) {
      return res.status(400).json({ error: 'manifest.json missing in archive root.' });
    }

    const manifest = JSON.parse(await manifestFile.async('string'));
    
    // Security override: Force publisher to match the authenticated user
    manifest.publisher = profile.publisher_id; 

    // Unique Database ID (e.g., cranonic.mono.side)
    const globalExtensionId = `${profile.publisher_id}.${manifest.id}`;

    // 4. Upload to Supabase Storage
    // publisher_id.plugin_id.msxt
    const storagePath = `${globalExtensionId}.msxt`; 
    
    const { data: storageData, error: storageErr } = await supabase.storage
      .from('extensions') 
      .upload(storagePath, fileBuffer, { 
        contentType: 'application/zip', // .msxt is zip file
        upsert: true // Override over old file
      });

    if (storageErr) throw storageErr;

    // 5. Update Database Record
    const { error: dbError } = await supabase
      .from('extensions')
      .upsert({
        id: globalExtensionId, // PK (Primary Key)
        publisher: profile.publisher_id,
        name: manifest.name,
        description: manifest.description,
        version: manifest.version, // update version to db
        category: manifest.category || 'Other',
        tags: manifest.tags || [],
        main: manifest.main,
        activates: manifest.activates || [],
        file_url: storageData.path, // (e.g., cranonic.mono.side.msxt)
        contributes: manifest.contributes || {},
        updated_at: new Date().toISOString()
      });

    if (dbError) throw dbError;

    // 6. Respond Success
    res.status(200).json({ 
      success: true, 
      extension: { id: globalExtensionId, version: manifest.version } 
    });

  } catch (error: any) {
    console.error("Publish Error:", error);
    res.status(500).json({ error: error.message || 'Internal server deployment error.' });
  }
}