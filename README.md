<div align="center">

# tabelhafin

**Personal finance with automatic Open Finance sync and AI categorisation — BYOK, no subscription.**

**English** · [Português](README.pt-BR.md)

[![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ianptkcs)

</div>

---

## What it is

A personal finance app that pulls its own data from Nubank (checking + credit
card) and XP (digital account + investments) over Open Finance, categorises
spending with AI and writes a monthly report on where there is room to improve —
with no manual bookkeeping.

Brazilian Open Finance is the domain here, so the interface is in Portuguese.
The code is in English.

## How it works

1. You log into **Meu Pluggy** (Pluggy's free personal product) and a small
   browser extension (load unpacked, no store) captures your session token
   automatically — no copy-paste.
2. A daily cron syncs accounts, transactions and investments through the Meu
   Pluggy API.
3. New transactions are categorised in batch by your own AI (BYOK: paste your
   own Anthropic, OpenAI or DeepSeek key), or by simple rules when no AI is
   configured.
4. On the first of each month a report for the previous month is generated,
   and a push notification tells you it is ready.
5. Uploading a statement or invoice PDF exists as a manual fallback — the file
   goes straight to the AI model you chose, with no parsing library involved.

It works as a PWA too: install it on a phone or desktop and use it like a
native app. Both AI and the Open Finance connection are **optional** — the app
works with neither, with manual entry and rule-based categorisation.

## Running locally

Stack: SvelteKit + Cloudflare Workers, Bun as the package manager.

```sh
bun install
bun run dev
```

Other useful commands:

```sh
bun run check    # typecheck
bun run lint     # prettier + eslint
bun run test     # unit tests (vitest)
bun run build    # production build
```

## Development

Stack and commands: see _Running locally_ above. Tests:

```sh
bun run test      # unit tests (vitest)
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the version history.

## Support the project

- **Global**: [ko-fi.com/ianptkcs](https://ko-fi.com/ianptkcs)
- **Brazil (Pix)**: scan the QR below or copy the code

  <img src="pix-qr.png" alt="Pix QR" width="200" />

  <details><summary>Pix code (copy)</summary>

  ```
  00020126580014BR.GOV.BCB.PIX01365ad933b0-dcdc-4525-a736-0759902aeec65204000053039865802BR5925Ian Patrick da Costa Soar6009SAO PAULO62140510tQA85x6Dov63041FB6
  ```

  </details>

## License

[AGPL-3.0](LICENSE) — strong copyleft: you may use, modify and even host
TAbelhaFin commercially, but any modified version, including one running as a
network service (SaaS), has to stay open source under the same license.
