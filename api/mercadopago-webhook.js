export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Metodo nao permitido." });
  }

  // O Mercado Pago chama este endpoint quando um pagamento muda de status.
  // Em producao, use SUPABASE_SERVICE_ROLE_KEY aqui para buscar o pagamento
  // aprovado e marcar o atendimento como pago no banco.
  console.log("Mercado Pago webhook", request.body);
  return response.status(200).json({ received: true });
}
