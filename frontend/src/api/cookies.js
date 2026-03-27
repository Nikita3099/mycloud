export function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const raw of cookies) {
    const cookie = raw.trim();
    if (!cookie) continue;
    const [k, ...rest] = cookie.split("=");
    if (k === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

