# Publicar e colocar para funcionar

## 1. Subir para o GitHub

Na pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versao do AgendaPro"
```

Depois crie um repositorio vazio no GitHub e rode:

```bash
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## 2. Publicar na Vercel

1. Entre em `https://vercel.com`
2. Clique em `Add New Project`
3. Conecte sua conta do GitHub
4. Escolha o repositorio do AgendaPro
5. Clique em `Deploy`

Como este projeto e estatico, nao precisa configurar build.

## 3. Comprar dominio

Voce pode comprar dominio em:

- Registro.br
- GoDaddy
- Hostinger
- Cloudflare Registrar

Exemplos:

- `agendapro.com.br`
- `minhaagenda.app`
- `agendainteligente.com.br`

Depois, configure o dominio na Vercel.

## 4. Receber assinatura

MVP mais simples:

1. Criar plano/link de pagamento no Mercado Pago ou Stripe
2. Colocar o link no botao do plano
3. Confirmar manualmente quem pagou

Versao profissional:

1. Usuario cria conta
2. Escolhe plano
3. Paga assinatura recorrente
4. Sistema libera ou bloqueia acesso automaticamente

## Custos iniciais

- Hospedagem: pode comecar gratis na Vercel ou Netlify
- Dominio: geralmente pago por ano
- Pagamento: Mercado Pago/Stripe cobram taxa por venda
- Banco/login: Supabase pode comecar gratis

Para validar a ideia, comece barato: site publicado, dominio simples e pagamento via link.
