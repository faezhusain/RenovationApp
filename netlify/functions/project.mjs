import * as identity from '@netlify/identity';
import * as blobs from '@netlify/blobs';
import {createNetlifyProjectHandler} from '../../server/netlify-adapter.js';

export const config = {path:'/api/project'};
export default createNetlifyProjectHandler({identity,blobs});
