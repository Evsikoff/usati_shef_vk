# Production build

The repository contains the raw GDevelop export. Vercel deploys the generated
`dist` directory instead of serving that export directly.

```sh
npm run build
npm run check:build
```

The build performs three request-count optimizations without changing game
logic or media quality:

- 132 local scripts are concatenated in their original order into two
  content-hashed bundles.
- Every GDevelop resource is copied to a content-hashed URL and `data.js` is
  rewritten to use those URLs.
- A missing favicon request is suppressed.

`vercel.json` keeps HTML revalidated while giving `/assets/*` a one-year,
immutable browser cache. Content hashes make this safe: a changed file receives
a new URL, while unchanged files stay cached between deployments.

Never point `immutable` caching at the unhashed root export. Doing so can mix
files from different game versions in a player's browser.
