import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, clientes: clientesList, storagePath } = body;

    // Action: upload - upload JSON to storage
    if (action === "upload") {
      const jsonData = JSON.stringify(clientesList);
      const { error } = await supabase.storage
        .from("uploads")
        .upload("import/clientes.json", jsonData, {
          contentType: "application/json",
          upsert: true,
        });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "File uploaded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: import - read from storage and import
    if (action === "import") {
      const { data: fileData, error: dlError } = await supabase.storage
        .from("uploads")
        .download("import/clientes.json");
      if (dlError) throw dlError;
      
      const text = await fileData.text();
      const allClientes = JSON.parse(text);
      
      if (!Array.isArray(allClientes)) throw new Error("Invalid data format");

      const oldToNewClientId: Record<string, string> = {};
      const clientesWithPrincipal: Array<{ newId: string; oldPrincipalId: string }> = [];

      let inserted = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      const batchSize = 50;
      for (let i = 0; i < allClientes.length; i += batchSize) {
        const batch = allClientes.slice(i, i + batchSize);
        
        const records = batch.map((c: any) => ({
          nome_completo: c.nome_completo || "SEM NOME",
          cpf: c.cpf || null,
          sexo: c.sexo || null,
          data_nascimento: c.data_nascimento || null,
          idade: c.idade ?? null,
          telefone: c.telefone || null,
          email: c.email || null,
          rua: c.rua || null,
          numero: c.numero || null,
          bairro: c.bairro || null,
          cidade: c.cidade || null,
          estado: c.estado || null,
          cep: c.cep || null,
          local_embarque: c.local_embarque || null,
          id_viagem: c.id_viagem ? (VIAGEM_ID_MAP[c.id_viagem] || null) : null,
          poltrona: c.poltrona ?? null,
          andar_onibus: c.andar_onibus || null,
          forma_pagamento: c.forma_pagamento || "À Vista",
          numero_parcelas: c.numero_parcelas || 1,
          valor_selecionado: c.valor_selecionado || "Valor 1",
          valor_personalizado: c.valor_personalizado || 0,
          e_crianca_colo: c.e_crianca_colo || false,
          possui_crianca_colo: c.possui_crianca_colo || false,
          nome_crianca_colo: c.nome_crianca_colo || null,
          idade_crianca_colo: c.idade_crianca_colo ?? null,
          id_cliente_principal: null,
          status_pagamento: c.status_pagamento || "Pendente",
          valor_total_pacote: c.valor_total_pacote || 0,
          valor_pago: c.valor_pago || 0,
          observacoes: c.observacoes || null,
          arquivado: c.arquivado || false,
          cor_grupo: c.cor_grupo || null,
          numero_grupo: c.numero_grupo || 1,
        }));

        const { data, error } = await supabase
          .from("clientes")
          .insert(records)
          .select("id");

        if (error) {
          errors += batch.length;
          errorDetails.push(`Batch ${Math.floor(i / batchSize)}: ${error.message}`);
        } else if (data) {
          inserted += data.length;
          for (let j = 0; j < batch.length; j++) {
            if (data[j]) {
              oldToNewClientId[batch[j].id] = data[j].id;
              if (batch[j].id_cliente_principal) {
                clientesWithPrincipal.push({
                  newId: data[j].id,
                  oldPrincipalId: batch[j].id_cliente_principal,
                });
              }
            }
          }
        }
      }

      let principalUpdated = 0;
      for (const item of clientesWithPrincipal) {
        const newPrincipalId = oldToNewClientId[item.oldPrincipalId];
        if (newPrincipalId) {
          await supabase
            .from("clientes")
            .update({ id_cliente_principal: newPrincipalId })
            .eq("id", item.newId);
          principalUpdated++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, total: allClientes.length, inserted, errors, principalUpdated, errorDetails: errorDetails.slice(0, 10) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Direct import with body data
    if (clientesList && Array.isArray(clientesList)) {
      const batchSize = 50;
      let inserted = 0;
      let errors = 0;
      
      for (let i = 0; i < clientesList.length; i += batchSize) {
        const batch = clientesList.slice(i, i + batchSize);
        const records = batch.map((c: any) => ({
          nome_completo: c.nome_completo || "SEM NOME",
          cpf: c.cpf || null,
          sexo: c.sexo || null,
          data_nascimento: c.data_nascimento || null,
          idade: c.idade ?? null,
          telefone: c.telefone || null,
          email: c.email || null,
          local_embarque: c.local_embarque || null,
          id_viagem: c.id_viagem ? (VIAGEM_ID_MAP[c.id_viagem] || null) : null,
          poltrona: c.poltrona ?? null,
          andar_onibus: c.andar_onibus || null,
          forma_pagamento: c.forma_pagamento || "À Vista",
          numero_parcelas: c.numero_parcelas || 1,
          valor_selecionado: c.valor_selecionado || "Valor 1",
          valor_personalizado: c.valor_personalizado || 0,
          e_crianca_colo: c.e_crianca_colo || false,
          possui_crianca_colo: c.possui_crianca_colo || false,
          nome_crianca_colo: c.nome_crianca_colo || null,
          idade_crianca_colo: c.idade_crianca_colo ?? null,
          status_pagamento: c.status_pagamento || "Pendente",
          valor_total_pacote: c.valor_total_pacote || 0,
          valor_pago: c.valor_pago || 0,
          observacoes: c.observacoes || null,
          arquivado: c.arquivado || false,
          cor_grupo: c.cor_grupo || null,
          numero_grupo: c.numero_grupo || 1,
        }));

        const { data, error } = await supabase.from("clientes").insert(records).select("id");
        if (error) errors += batch.length;
        else if (data) inserted += data.length;
      }

      return new Response(
        JSON.stringify({ success: true, total: clientesList.length, inserted, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "No valid action or data" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
