// Platform-neutral handler. The Netlify adapter will provide verified identity,
// request-origin checking and a strongly consistent Blob store.
const MAX_BYTES = 4 * 1024 * 1024;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie' };
const response = (body, status, extra={}) => new Response(body, {status, headers:{...headers,...extra}});
const basicProject = x => x && typeof x === 'object' && x.version === 1 && x.project && typeof x.project === 'object' &&
  ['costs','payments','quotes','tasks','receipts','sellerCodes','paymentCorrections'].every(key=>Array.isArray(x[key]));

export function createProjectHandler({getUser, verifyOrigin, getStore}) {
  return async function handle(request) {
    if (!['GET','PUT'].includes(request.method)) return response('Method not allowed',405,{'Allow':'GET, PUT'});
    let user;
    try { user = await getUser(); } catch { return response('Authentication unavailable',503); }
    if (!user || typeof user.id !== 'string' || !user.id || user.id.length>128) return response('Sign in required',401);
    // No key is accepted from the caller: each verified identity has one project.
    const key = `user/${encodeURIComponent(user.id)}/project`;
    let store;
    try { store = getStore(); } catch { return response('Storage unavailable',503); }
    if (request.method === 'GET') {
      try {
        const entry = await store.getWithMetadata(key, {type:'json', consistency:'strong'});
        if (!entry) return response('No project found',404);
        return response(JSON.stringify(entry.data),200,{'Content-Type':'application/json; charset=utf-8','ETag':entry.etag});
      } catch { return response('Storage unavailable',503); }
    }
    try { await verifyOrigin(request); } catch { return response('Invalid request origin',403); }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||'')) return response('JSON required',415);
    const previous = request.headers.get('if-match');
    const create = request.headers.get('if-none-match') === '*';
    if (Boolean(previous) === create) return response('A single version precondition is required',428);
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BYTES) return response('Project is too large',413);
    let text;
    try { text=await request.text(); } catch { return response('Invalid request body',400); }
    if (new TextEncoder().encode(text).length > MAX_BYTES) return response('Project is too large',413);
    let value;
    try { value=JSON.parse(text); } catch { return response('Invalid JSON',400); }
    if (!basicProject(value)) return response('Invalid project',400);
    try {
      const result=await store.setJSON(key,value,create?{onlyIfNew:true}:{onlyIfMatch:previous});
      if (!result.modified) return response('Project changed on another device',409);
      return response(null,204,{'ETag':result.etag});
    } catch { return response('Storage unavailable',503); }
  };
}
