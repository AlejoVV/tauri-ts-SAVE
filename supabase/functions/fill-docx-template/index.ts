// Edge Function: fill-docx-template
// Reads a .docx template from Supabase Storage
// Fills it using docx-templates with provided JSON data
// Returns a generated .docx file as the response

// Importaciones para Deno
// @deno-types="https://unpkg.com/docx-templates/lib/bundled.d.ts"
import { createReport } from "npm:docx-templates";
import { createClient } from "npm:@supabase/supabase-js@2.49.6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false
  }
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Expected usage: POST /fill-docx-template
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Use POST with JSON body containing data and optional filename"
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Default template configuration
    const bucket = "Plantillas";
    const path = "Plantilla_reportes_eficacia.docx";
    
    const body = await req.json().catch(() => ({}));
    const data = body.data || {}; // data to inject into the template
    const filename = body.filename || `reporte_${new Date().toISOString().split('T')[0]}.docx`;
    
    console.log('Processing template with data:', JSON.stringify(data, null, 2));
    
    // Fetch template from Storage
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (downloadError) {
      console.error("Storage download error", downloadError);
      return new Response(JSON.stringify({
        error: "Failed to download template",
        details: downloadError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Read template into a Uint8Array
    const arrayBuffer = await downloadData.arrayBuffer();
    const templateUint8 = new Uint8Array(arrayBuffer);
    
    console.log('Template loaded, size:', templateUint8.length, 'bytes');
    
    // Use docx-templates to produce a new docx
    const buffer = await createReport({
      template: templateUint8,
      data,
      cmdDelimiter: ['{', '}'],
      noSandbox: true, // Required for Deno
    });
    
    console.log('Document generated successfully, size:', buffer.length, 'bytes');
    
    // Return as downloadable .docx
    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new Response(buffer, {
      status: 200,
      headers
    });
    
  } catch (err) {
    console.error("Unhandled error", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});