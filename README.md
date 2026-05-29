# AgendaPro

Sistema web app para saloes controlarem agenda, clientes, pagamentos, lembretes por WhatsApp, perfil e relatorios.

Produto criado por MatheusDevPrado.

## O que ja funciona

- Agenda de atendimentos
- Cadastro e busca de clientes
- Controle de pagamentos pendentes
- Link de cobranca e lembrete por WhatsApp
- Relatorio mensal com download CSV
- Perfil editavel com foto, telefone, e-mail e configuracoes
- Modo local com `localStorage`
- Login/sincronizacao no Supabase quando configurado
- Endpoint seguro para criar link de pagamento no Mercado Pago

## Como abrir no computador

```bash
python3 -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173
```

## Configuracao para producao

Edite `config.js` com os dados publicos do cliente:

```js
window.AGENDAPRO_CONFIG = {
  productionDomain: "https://agenda.nomedosalao.com.br",
  apiBaseUrl: "",
  paymentProvider: "mercadopago",
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "SUA_CHAVE_ANON_PUBLICA"
};
```

No Supabase, rode o SQL de `supabase/schema.sql`.

Na Vercel, configure as variaveis de ambiente:

```text
MERCADO_PAGO_ACCESS_TOKEN=APP_USR...
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.com/api/mercadopago-webhook
PUBLIC_APP_URL=https://seu-dominio.com
```

## Observacoes importantes

- `supabaseAnonKey` pode ficar no front porque e uma chave publica protegida por RLS.
- `MERCADO_PAGO_ACCESS_TOKEN` nunca deve ficar no front. Ele fica apenas na Vercel.
- WhatsApp atual abre mensagem pronta via `wa.me`. Envio automatico exige API oficial ou provedor externo.
- O webhook do Mercado Pago ja existe como base, mas precisa ser ligado ao banco para marcar pagamentos automaticamente em producao.
