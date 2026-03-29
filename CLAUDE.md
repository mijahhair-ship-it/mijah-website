# Claude Code Configuration

## Règle importante — Dossier mijah.brandnew

Ce dossier est EXCLUSIVEMENT réservé au site web Mijah.fr.

- Ne jamais créer, enregistrer ou déplacer ici des fichiers qui ne sont pas directement liés au site Mijah.fr.
- Si une tâche ne concerne pas le site Mijah.fr, refuser de créer des fichiers dans ce dossier et diriger l'utilisateur vers `C:\Users\PC\Desktop\Code.Folder` à la place.
- Fichiers autorisés : HTML, CSS, JS, images/vidéos produits Mijah, fichiers de config Netlify, SEO, et assets du site.

## gstack

Use gstack skills to structure your development workflow. Start with `/office-hours` to brainstorm ideas, then follow: `/plan-ceo-review` → `/plan-eng-review` → `/plan-design-review` → `/review` → `/qa` → `/ship` → `/land-and-deploy`.

Use `/browse` from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours` - YC Office Hours: reframe ideas, challenge premises
- `/plan-ceo-review` - CEO/Founder: rethink scope, find 10-star product
- `/plan-eng-review` - Eng Manager: lock architecture, data flow, edge cases
- `/plan-design-review` - Senior Designer: audit design dimensions 0-10
- `/design-consultation` - Design Partner: build complete design system
- `/design-shotgun` - Design Explorer: generate multiple variants
- `/design-review` - Designer Who Codes: audit + fix design
- `/review` - Staff Engineer: find production bugs, auto-fix obvious ones
- `/investigate` - Debugger: systematic root-cause analysis
- `/qa` - QA Lead: test with real browser, auto-generate regression tests
- `/qa-only` - QA Reporter: bug report only, no code changes
- `/ship` - Release Engineer: sync, test, push, PR
- `/land-and-deploy` - Release Engineer: merge → CI → deploy → verify production
- `/canary` - SRE: post-deploy monitoring, error detection
- `/benchmark` - Performance Engineer: baseline Core Web Vitals
- `/browse` - QA Engineer: real Chromium headless browser (~100ms/command)
- `/cso` - Chief Security Officer: OWASP Top 10 + STRIDE threat model
- `/document-release` - Technical Writer: auto-update all project docs
- `/retro` - Eng Manager: weekly retro with team insights
- `/codex` - Multi-AI Review: independent 2nd opinion from OpenAI
- `/careful` - Safety Guardrails: warn before destructive commands
- `/freeze` - Edit Lock: restrict changes to one directory
- `/guard` - Full Safety: /careful + /freeze combined
- `/unfreeze` - Unlock: remove /freeze boundary
- `/gstack-upgrade` - Self-Updater: upgrade to latest gstack version
- `/connect-chrome` - Chrome Controller: launch real Chrome with Side Panel
- `/setup-browser-cookies` - Session Manager: import cookies from real browser
- `/setup-deploy` - Deploy Configurator: one-time deploy command setup
- `/autoplan` - Review Pipeline: fully reviewed plan in one command

If gstack skills aren't working, run: `cd ~/.claude/skills/gstack && ./setup`

## Project Skills

Your custom project skills are in `.github/skills/`:
- `/cinematic-website` - Build high-performance, visually stunning websites with SEO
- `/frontend-design` - Create distinctive, production-grade UI components
- `/pdf` - Read, create, and review PDF files
- `/security-guidance` - Review code for vulnerabilities and implement security best practices
- `/brainstorming` - Turn ideas into fully formed designs through collaborative dialogue
- `/requesting-code-review` - Request code review from a dedicated reviewer subagent
