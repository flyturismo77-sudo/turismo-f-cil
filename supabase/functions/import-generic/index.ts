import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map old Base44 IDs to new Supabase UUIDs
const VIAGEM_ID_MAP: Record<string, string> = {
  "69135a0ee43a9c5f2a82cc77": "2138c77b-9218-4480-a44c-e4bf371a7d90",
  "692748eaca14ab1fc741ec58": "f7c02d1b-fb25-4f3d-9e5b-6091c2f6cf1d",
  "69135f058863d49d3f81a0f6": "f6d2cd14-d2f3-40b4-af04-b68a5a0be805",
  "69135afc8755325fd56bac75": "89862d17-2857-40c3-bebc-b966c8edcb76",
  "69135b75fea7c9b43eb29ddc": "02d7fb4a-3374-448a-b34e-6d71fb3a3302",
  "6913906d844a5f9a02ade78b": "4daaa9ec-92ff-4bf3-b1cc-2754ccf37d73",
  "69135f5f09181049b1587cf7": "ffe9e1eb-d46c-4b84-b264-6e2854432010",
  "694037cd34fb5c57d30c7fb3": "5b57368d-82d6-4c55-8f46-fc1e855c3b39",
  "690e061130ed1175c9f10bd3": "c3654d22-3a0e-4805-b774-a8585768cb1e",
  "690cd38ea99ea23dfaa1f756": "08013a11-f41a-45b3-b6f7-ffdd186d3943",
};

// Allowed tables for import
const ALLOWED_TABLES = [
  "clientes", "assentos", "quartos", "pagamentos", "parcelas",
  "equipe", "fornecedores", "documentos_viagem", "pagamentos_empresa",
  "formularios", "formularios_contrato", "contatos", "mensagens",
];

// Fields to exclude (auto-generated)
const EXCLUDE_FIELDS = ["created_date", "updated_date"];

function mapRecord(record: any, table: string): any {
  const mapped: any = {};

  for (const [key, value] of Object.entries(record)) {
    // Skip internal Base44 fields
    if (key === "id" || key === "__v" || key === "_id" || EXCLUDE_FIELDS.includes(key)) continue;

    // Map id_viagem from old to new
    if (key === "id_viagem" && typeof value === "string" && value.length === 24) {
      mapped.id_viagem = VIAGEM_ID_MAP[value] || null;
      continue;
    }

    // Map id_cliente from old to new (will be handled separately if needed)
    if (key === "id_cliente_principal" || key === "id_cliente" || key === "id_quarto") {
      // These reference other tables - skip for now, set null
      // We can't map these without knowing the old->new ID mapping
      mapped[key] = null;
      continue;
    }

    mapped[key] = value === undefined ? null : value;
  }

  return mapped;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { table, records } = body;

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Tabela inválida: ${table}. Tabelas permitidas: ${ALLOWED_TABLES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum registro encontrado no arquivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let inserted = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const batchSize = 50;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const mappedBatch = batch.map((r: any) => mapRecord(r, table));

      const { data, error } = await supabase
        .from(table)
        .insert(mappedBatch)
        .select("id");

      if (error) {
        errors += batch.length;
        errorDetails.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else if (data) {
        inserted += data.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        table,
        total: records.length,
        inserted,
        errors,
        errorDetails: errorDetails.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
