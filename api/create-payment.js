export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Metodo nao permitido." });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return response.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN nao configurado." });
  }

  let body = {};
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  } catch {
    return response.status(400).json({ error: "JSON invalido." });
  }
  const price = Number(body.price);

  if (!body.service || !Number.isFinite(price) || price <= 0) {
    return response.status(400).json({ error: "Dados do atendimento invalidos." });
  }

  const origin = request.headers.origin || process.env.PUBLIC_APP_URL || "https://agendapro.app";
  const title = `${body.service} - ${body.businessName || "AgendaPro"}`;

  const mercadoPagoResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: body.appointmentId,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL || undefined,
      items: [
        {
          title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: price
        }
      ],
      payer: {
        name: body.clientName || "",
        phone: body.clientPhone ? { number: body.clientPhone } : undefined
      },
      back_urls: {
        success: `${origin}/index.html#pagamentos`,
        pending: `${origin}/index.html#pagamentos`,
        failure: `${origin}/index.html#pagamentos`
      },
      auto_return: "approved"
    })
  });

  const result = await mercadoPagoResponse.json();
  if (!mercadoPagoResponse.ok) {
    return response.status(mercadoPagoResponse.status).json({
      error: result.message || "Erro ao criar preferencia no Mercado Pago.",
      details: result
    });
  }

  return response.status(200).json({
    id: result.id,
    paymentUrl: result.init_point || result.sandbox_init_point
  });
}
