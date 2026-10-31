# Papier

Oefenwebsite voor crypto- en aandelenhandel met nepgeld. Alles is fictief: munten, aandelen, koersen en nieuws. Geen build, geen dependencies.

## Lokaal draaien
ES-modules werken niet via `file://`, dus start een kleine server in deze map:

    python -m http.server 8000

Open daarna http://localhost:8000.

## Deployen (Cloudflare Workers, static assets)
- Via Git: Cloudflare dashboard > Workers & Pages > Create > Import a repository. Kies de repo en zet de root directory op `papier` als de site in een submap staat.
- Of met de CLI: `npx wrangler deploy` in deze map.

`wrangler.jsonc` publiceert de hele map; `.assetsignore` houdt `.git`, `wrangler.jsonc` en de README eruit.
