# Publicar o AgendaPro

## 1. Supabase

1. Crie um projeto no Supabase.
2. Abra `SQL Editor`.
3. Rode o arquivo `supabase/schema.sql`.
4. Copie:
   - Project URL
   - anon public key
5. Cole esses valores em `config.js`.

## 2. Mercado Pago

1. Crie uma aplicacao no painel do Mercado Pago.
2. Copie o access token de producao.
3. Na Vercel, crie a variavel:

```text
MERCADO_PAGO_ACCESS_TOKEN=APP_USR...
```

4. Depois que o dominio existir, configure:

```text
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.com/api/mercadopago-webhook
PUBLIC_APP_URL=https://seu-dominio.com
```

## 3. Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis de ambiente.
4. Clique em Deploy.
5. Conecte o dominio do salao.

## 4. WhatsApp

O app ja gera mensagens prontas para WhatsApp sem custo.

Para envio automatico, contratar depois:

- WhatsApp Cloud API da Meta
- Twilio
- Z-API
- outro provedor homologado

## 5. Checklist antes de entregar ao cliente

- Dominio conectado
- Supabase configurado
- Login testado
- Mercado Pago com token de producao
- Link de pagamento testado
- Relatorio CSV testado
- Dados iniciais do salao cadastrados
- Treinamento de 1 semana combinado
- 3 semanas de suporte gratuito registradas na proposta
