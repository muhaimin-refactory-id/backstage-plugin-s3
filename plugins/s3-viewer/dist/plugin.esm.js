import { createPlugin, createApiFactory, discoveryApiRef, fetchApiRef, createRoutableExtension } from '@backstage/core-plugin-api';
import { S3ApiRef, S3Client } from './api.esm.js';
import { rootRouteRef } from './routes.esm.js';

const s3ViewerPlugin = createPlugin({
  id: "s3-viewer",
  apis: [
    createApiFactory({
      api: S3ApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef
      },
      factory: (deps) => new S3Client(deps)
    })
  ],
  routes: {
    root: rootRouteRef
  }
});
const S3ViewerPage = s3ViewerPlugin.provide(
  createRoutableExtension({
    name: "S3ViewerPage",
    component: () => import('./components/S3ViewerPage/S3ViewerPage.esm.js').then((m) => m.S3ViewerPage),
    mountPoint: rootRouteRef
  })
);

export { S3ViewerPage, s3ViewerPlugin };
//# sourceMappingURL=plugin.esm.js.map
