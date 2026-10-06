<div align="center">

# tabelhafin

**Finanças pessoais com sync automático via Open Finance e categorização com IA — BYOK, sem assinatura.**

[English](README.md) · **Português**

[![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ianptkcs)

</div>

---

## O que é

App de finanças pessoais que puxa sozinho os dados do Nubank (conta + cartão)
e da XP (conta digital + investimentos) via Open Finance, categoriza gastos
com IA e gera um relatório mensal de onde dá pra melhorar — sem lançamento
manual.

Como o domínio é o Open Finance brasileiro, a interface é em português. O
código é em inglês.

## Como funciona

1. Você entra no **Meu Pluggy** (produto pessoal gratuito do Pluggy) e uma
   pequena extensão de navegador (load unpacked, sem store) captura seu
   session token automaticamente — sem copiar e colar.
2. Um cron diário sincroniza contas, transações e investimentos pela API do
   Meu Pluggy.
3. Transações novas são categorizadas em lote pela sua própria IA (BYOK:
   cole sua key da Anthropic, OpenAI ou DeepSeek), ou por regras simples
   quando não há IA configurada.
4. No primeiro dia de cada mês um relatório do mês anterior é gerado, e uma
   push notification avisa que está pronto.
5. Subir um extrato ou fatura em PDF existe como fallback manual — o arquivo
   vai direto pro modelo de IA que você escolheu, sem biblioteca de parsing.

Funciona como PWA também: instale no celular ou desktop e use como app
nativo. Tanto a IA quanto a conexão Open Finance são **opcionais** — o app
funciona sem nenhum dos dois, com lançamento manual e categorização por
regras.

## Rodando localmente

Stack: SvelteKit + Cloudflare Workers, Bun como package manager.

```sh
bun install
bun run dev
```

Outros comandos úteis:

```sh
bun run check    # typecheck
bun run lint     # prettier + eslint
bun run test     # testes unitários (vitest)
bun run build    # build de produção
```

## Desenvolvimento

Stack e comandos: ver _Rodando localmente_ acima. Testes:

```sh
bun run test      # testes unitários (vitest)
```

## Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para o histórico de versões.

## Apoie o projeto

- **Global**: [ko-fi.com/ianptkcs](https://ko-fi.com/ianptkcs)
- **Brasil (Pix)**: escaneie o QR abaixo ou copie o código

  <img src="pix-qr.png" alt="Pix QR" width="200" />

  <details><summary>Código Pix (copiar)</summary>

  ```
  00020126580014BR.GOV.BCB.PIX01365ad933b0-dcdc-4525-a736-0759902aeec65204000053039865802BR5925Ian Patrick da Costa Soar6009SAO PAULO62140510tQA85x6Dov63041FB6
  ```

  </details>

## Licença

[AGPL-3.0](LICENSE) — copyleft forte: você pode usar, modificar e até
hospedar o TAbelhaFin comercialmente, mas qualquer versão modificada,
incluindo uma rodando como serviço de rede (SaaS), tem que continuar open
source sob a mesma licença.
