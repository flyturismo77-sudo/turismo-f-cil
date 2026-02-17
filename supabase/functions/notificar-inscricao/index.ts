import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      nome_cliente,
      telefone,
      email,
      viagem_nome,
      viagem_destino,
      forma_pagamento,
      numero_parcelas,
      total_passageiros,
    } = await req.json();

    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #0284c7, #1d4ed8); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✈️ Nova Inscrição Recebida!</h1>
          <p style="color: #bae6fd; margin: 8px 0 0; font-size: 14px;">Fly Turismo – Sistema de Formulários</p>
        </div>
        
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;"><strong>Recebido em:</strong> ${now}</p>
          </div>

          <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">👤 Dados do Cliente</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; color: #64748b; width: 40%;">Nome</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${nome_cliente}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: #64748b;">Telefone / WhatsApp</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${telefone}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; color: #64748b;">E-mail</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${email}</td>
            </tr>
          </table>

          <h2 style="color: #1e293b; font-size: 18px; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">✈️ Dados da Viagem</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; color: #64748b; width: 40%;">Viagem</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${viagem_nome}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: #64748b;">Destino</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${viagem_destino}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px 12px; color: #64748b;">Total de Passageiros</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #0284c7;">${total_passageiros} pessoa(s)</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: #64748b;">Forma de Pagamento</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${forma_pagamento}${forma_pagamento === 'Parcelado' ? ` em ${numero_parcelas}x` : ''}</td>
            </tr>
          </table>

          <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin-top: 24px; text-align: center;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">⚡ Acesse o painel para revisar e processar esta inscrição</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #b45309;">Vá em <strong>Formulários</strong> no menu lateral do sistema</p>
          </div>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Fly Turismo <onboarding@resend.dev>",
        to: ["flyturismo77@gmail.com"],
        subject: `🔔 Nova inscrição: ${nome_cliente} → ${viagem_nome}`,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notificar inscricao error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
