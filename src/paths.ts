const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path: string) {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}` || '/';
}

export function fromBase(path: string) {
  return basePath && (path === basePath || path.startsWith(`${basePath}/`))
    ? path.slice(basePath.length) || '/'
    : path;
}

export function publicAsset(path: string) {
  if (/^(?:https?:)?\/\//i.test(path)) return path;
  return withBase(path);
}

