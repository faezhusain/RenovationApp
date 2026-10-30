import {createProjectHandler} from './project-api.js';

// Dependencies are injected here so this adapter can be tested without
// making network calls or loading project credentials.
export function createNetlifyProjectHandler({identity, blobs}) {
  return (request, context) => {
    // Blob stores are shared across deploys. Never let a preview see or
    // overwrite production data, even for the same signed-in user.
    const deployContext = context?.deploy?.context;
    const storeName = deployContext === 'production' ? 'renovation-projects' :
      ['branch-deploy', 'deploy-preview', 'dev'].includes(deployContext) ? 'renovation-projects-preview' : null;
    if (!storeName) return new Response('Deploy context unavailable', {status:503, headers:{'Cache-Control':'no-store'}});
    return createProjectHandler({
      getUser: () => identity.getUser(),
      verifyOrigin: request => identity.verifyRequestOrigin(request),
      getStore: () => blobs.getStore({name:storeName, consistency:'strong'})
    })(request);
  };
}
