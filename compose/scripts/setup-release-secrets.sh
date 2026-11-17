#!/usr/bin/env bash
# One-time setup for publishing the Compose kit to Maven Central from GitHub Actions.
# Run it yourself (it asks for your Central token, which should never pass through anyone else):
#   bash compose/scripts/setup-release-secrets.sh   (Windows: & "C:\Program Files\Git\bin\bash.exe" compose/scripts/setup-release-secrets.sh)
# Needs: gpg, gh (logged in with access to the repo), curl.
# It makes a signing key with no e-mail in it, publishes the public half to two keyservers (Central checks
# signatures against them), and stores five repository secrets that publish-compose.yml reads.
set -euo pipefail
repo=InomjonIsmaylov/kometa-ui-kit

# Check everything before making a key: on Windows, `bash` from PowerShell can be WSL, which has no gh.
for t in gpg gh curl openssl; do
  command -v "$t" >/dev/null || { echo "$t not found in this shell. On Windows run it with Git Bash: & \"C:\Program Files\Git\bin\bash.exe\" $0"; exit 1; }
done
gh auth status >/dev/null 2>&1 || { echo "gh is not logged in here; run gh auth login first."; exit 1; }

read -rp "Maven Central user token, username part: " central_user
read -rsp "Maven Central user token, password part: " central_pass; echo
# Windows consoles and Git Bash's native openssl can end a value with \r, which GitHub drops from a secret.
central_user=${central_user//$'\r'/}; central_pass=${central_pass//$'\r'/}
[ -n "$central_user" ] && [ -n "$central_pass" ] || { echo "Both parts are needed (central.sonatype.com → View Account → Generate User Token)."; exit 1; }

pass=$(openssl rand -base64 32 | tr -d '\r\n')
uid="Kometa UI release signing ($(date '+%Y-%m-%d %H:%M:%S'))" # unique, so a rerun finds its own key
gpg --batch --pinentry-mode loopback --passphrase "$pass" --quick-gen-key "$uid" ed25519 sign 3y
fpr=$(gpg --list-keys --with-colons "$uid" | awk -F: '/^fpr/ {print $10; exit}')
echo "Signing key: $fpr"
# Prove the passphrase opens the key before storing anything.
echo check | gpg --batch --pinentry-mode loopback --passphrase "$pass" -u "$fpr" --clearsign >/dev/null \
  || { echo "The new key does not sign with its passphrase; nothing was stored."; exit 1; }

gpg --keyserver hkps://keyserver.ubuntu.com --send-keys "$fpr"
gpg --armor --export "$fpr" | curl -fsS -T - https://keys.openpgp.org >/dev/null && echo "Uploaded to keys.openpgp.org"

gpg --batch --pinentry-mode loopback --passphrase "$pass" --armor --export-secret-keys "$fpr" \
  | gh secret set MAVEN_SIGNING_KEY -R "$repo"
printf %s "$pass" | gh secret set MAVEN_SIGNING_KEY_PASSWORD -R "$repo"
printf %s "${fpr: -8}" | gh secret set MAVEN_SIGNING_KEY_ID -R "$repo"
printf %s "$central_user" | gh secret set MAVEN_CENTRAL_USERNAME -R "$repo"
printf %s "$central_pass" | gh secret set MAVEN_CENTRAL_PASSWORD -R "$repo"
echo "Done. The key stays in your local gpg keyring as a backup; the secrets are on $repo."
