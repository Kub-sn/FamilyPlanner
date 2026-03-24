function readParamFromUrl(param: string, url: URL) {
  const searchValue = url.searchParams.get(param);

  if (searchValue) {
    return searchValue;
  }

  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  return hashParams.get(param);
}

export function getAuthRedirectMessage(href: string) {
  const url = new URL(href);
  const type = readParamFromUrl('type', url);
  const accessToken = readParamFromUrl('access_token', url);
  const tokenHash = readParamFromUrl('token_hash', url);
  const errorDescription = readParamFromUrl('error_description', url);

  if (errorDescription) {
    return null;
  }

  if (type === 'signup' && (accessToken || tokenHash)) {
    return 'E-Mail bestätigt. Du bist jetzt erfolgreich angemeldet.';
  }

  return null;
}

export function clearAuthRedirectState(href: string) {
  const url = new URL(href);
  const authSearchParams = [
    'access_token',
    'refresh_token',
    'expires_at',
    'expires_in',
    'token_type',
    'type',
    'code',
    'error',
    'error_code',
    'error_description',
  ];

  for (const param of authSearchParams) {
    url.searchParams.delete(param);
  }

  url.hash = '';

  return `${url.pathname}${url.search}${url.hash}`;
}
