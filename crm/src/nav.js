// Hash routes: #/ledgers/H4 → { page: 'ledgers', arg: 'H4' }
export function parseHash() {
  const [page, arg] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { page: page || 'dashboard', arg: arg ? decodeURIComponent(arg) : null }
}

export const go = (page, arg) => {
  window.location.hash = `/${page}${arg ? `/${encodeURIComponent(arg)}` : ''}`
}
