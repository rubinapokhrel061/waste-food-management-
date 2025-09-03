export function hashPassword(password: string): string {
  let hash = 0;
  const prime = 31;
  const mod = 1e9 + 9;

  for (let i = 0; i < password.length; i++) {
    hash = (hash * prime + password.charCodeAt(i)) % mod;
  }

  return hash.toString();
}
