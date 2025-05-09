import { createRouteRef } from '@backstage/core-plugin-api';

const rootRouteRef = createRouteRef({
  id: "s3-viewer",
  params: ["endpoint", "bucket", "*"]
});

export { rootRouteRef };
//# sourceMappingURL=routes.esm.js.map
