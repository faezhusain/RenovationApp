import {createProjectHandler} from './project-api.js';

// Dependencies are injected here so this adapter can be tested without
// making network calls or loading project credentials.
export function createNetlifyProjectHandler({identity, blobs}) {
  return createProjectHandler({
    getUser: () => identity.getUser(),
    verifyOrigin: request => identity.verifyRequestOrigin(request),
    getStore: () => blobs.getStore({name:'renovation-projects', consistency:'strong'})
  });
}
