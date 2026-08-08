// api/upload.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import semver from 'semver';
import JSZip from 'jszip';
import axios from 'axios';
import os from 'os';
import path from 'path';

export const config = { api: { bodyParser: false } };

const IMGBB_API_KEYS = ['3060f230a7b2e5e987fff11e1688680f', 'fca7f71e1d8ddd4f9f851f05e23fd431'];

async function uploadToImgBB(base64Image: string): Promise<string> {
  const selectedKey = IMGBB_API_KEYS[Math.floor(Math.random() * IMGBB_API_KEYS.length)];
  const formData = new URLSearchParams();
  formData.append('image', base64Image);
  const response = await axios.post(`https://api.imgbb.com/1/upload?key=${selectedKey}`, formData);
  return response.data.data.url; 
}

const findFileFuzzy = (zip: JSZip, targetName: string) => {
  const lowerTarget = targetName.toLowerCase();
  return Object.values(zip.files).find(f => !f.dir && f.name.toLowerCase().endsWith(lowerTarget));
};

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) return res.status(401).json({ error: "Invalid or expired token" });

  const { data: profile, error: profileError } = await supabase
    .from('publishers')
    .select('publisher_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return res.status(403).json({ error: "Publisher profile not found." });
  
  const verifiedPublisherId = profile.publisher_id.toLowerCase().replace(/\s+/g, '-');

  const form = formidable({ 
    multiples: false,
    uploadDir: os.tmpdir(),
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024 // 50MB limit
  });
  
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable Parse Error:", err);
        return res.status(500).json({ error: "Form parsing error" });
      }

      const fileArray = files.file;
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      if (!file) return res.status(400).json({ error: "No file uploaded." });

      const manifestStr = Array.isArray(fields.manifest) ? fields.manifest[0] : fields.manifest;
      let manifest = JSON.parse(manifestStr || '{}');

      manifest.publisher = verifiedPublisherId;

      try {
        // Read file using standard Node.js fs
        const fileBuffer = fs.readFileSync(file.filepath);

        const zip = await JSZip.loadAsync(fileBuffer);

        let dbIcon = "";
        if (manifest.icon) {
          const iconFile = findFileFuzzy(zip, manifest.icon);
          if (iconFile) {
            const iconBuffer = await iconFile.async("nodebuffer");
            dbIcon = await uploadToImgBB(iconBuffer.toString("base64"));
          }
        }

        let dbReadme = "";
        if (manifest.readme) {
          const readmeFile = findFileFuzzy(zip, manifest.readme);
          if (readmeFile) dbReadme = await readmeFile.async("string");
        }

        let dbChangelog = "";
        if (manifest.changelog) {
          const changelogFile = findFileFuzzy(zip, manifest.changelog);
          if (changelogFile) dbChangelog = await changelogFile.async("string");
        }

        const fullExtensionId = `${verifiedPublisherId}.${manifest.id}`;

        const { data: existing, error: checkError } = await supabase
          .from('extensions')
          .select('version')
          .eq('id', fullExtensionId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
           console.error("[Supabase Fatal] Query failed:", checkError);
        }

        if (existing && !semver.gt(manifest.version, existing.version)) {
          return res.status(400).json({ error: `Version conflict! New version (${manifest.version}) must be higher than the existing version (${existing.version}).` });
        }

        const fileName = `${fullExtensionId}.msxt`;
        
        await supabase.storage.from('extensions').upload(fileName, fileBuffer, { upsert: true });

        const { error: upsertError } = await supabase.from('extensions').upsert({
          id: fullExtensionId,
          name: manifest.name,
          publisher: verifiedPublisherId,
          description: manifest.description,
          version: manifest.version,
          category: manifest.category,
          tags: manifest.tags || [],
          icon: dbIcon,            
          readme: dbReadme,
          changelog: dbChangelog,
          contributes: manifest.contributes || {}, 
          main: manifest.main,
          activates: manifest.activates || [],
          file_url: fileName
        });

        if (upsertError) throw upsertError;

        // Cleanup temp file after success
        if (fs.existsSync(file.filepath)) {
           fs.unlinkSync(file.filepath);
        }
        
        return res.status(200).json({ message: "Success", fileName, iconUrl: dbIcon });

      } catch (e: any) {
        console.error("Processing Error:", e);
        return res.status(500).json({ error: e.message || "Error processing extension contents." });
      }
    });
  } catch (err: any) {
    console.error("Catch All Error:", err);
    return res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
}