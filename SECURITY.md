# Security policy

## Supported versions

kometa-ui is 0.x: security fixes go into the newest minor release only (today 0.4.x). Update to it to get them.
The Compose port (`io.github.inomjonismaylov:kometa-ui` on Maven Central) follows the same rule for its own versions.

## Reporting a vulnerability

Please do not open a public issue. Report it privately through GitHub:
[Security → Report a vulnerability](https://github.com/InomjonIsmaylov/kometa-ui-kit/security/advisories/new).

Include the version, the component, and the smallest steps or template that show the problem. You should get a reply
within 7 days. A confirmed issue gets a fixed release and a GitHub security advisory that credits you, unless you
would rather not be named.

## What the kit does that a security review may ask about

- Runtime dependency: `tslib` only; the rest are Angular peer dependencies.
- npm releases are published from GitHub Actions with provenance (npm trusted publishing), never from a laptop.
- No component calls `bypassSecurityTrust*` or writes HTML from inputs; text is bound through Angular templates.
- Strict Content-Security-Policy: two pieces add a global `<style>` tag at runtime (the motion keyframes and the
  tooltip). Both take Angular's `CSP_NONCE`, so provide it (or set `ngCspNonce` on the root element) and
  `style-src 'nonce-…'` works. Component styles are Angular's own and follow the same nonce.
