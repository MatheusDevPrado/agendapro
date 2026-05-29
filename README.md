# AgendaPro

Agenda simples para pequenos negocios: manicure, barbeiro, personal, terapeuta, dentista pequeno e professor particular.

## O que ja funciona

- Agenda de atendimentos
- Cadastro de clientes
- Controle de pagamentos pendentes
- Link de lembrete por WhatsApp
- Planos de assinatura
- Dados salvos no navegador do usuario

## Como abrir no computador

Abra o arquivo `index.html` no navegador.

Tambem da para rodar com um servidor local:

```bash
python3 -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173
```

## Como publicar rapido

Este projeto e um site estatico. Pode ser publicado em:

- Vercel
- Netlify
- GitHub Pages

Para comecar vendendo, a forma mais simples e criar links de pagamento no Mercado Pago ou Stripe e colocar esses links nos botoes dos planos.

## Proximos passos profissionais

Para virar um SaaS completo com assinatura real:

- Login de usuarios
- Banco de dados online
- Pagamento recorrente
- Controle de plano ativo
- Lembretes automaticos
- Painel administrativo

Uma stack simples para isso:

- Frontend: React ou Next.js
- Banco/login: Supabase
- Pagamento: Mercado Pago ou Stripe
- Hospedagem: Vercel
