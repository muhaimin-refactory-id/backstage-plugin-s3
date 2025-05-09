import { jsx } from 'react/jsx-runtime';
import { InfoCard } from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import { S3ViewerContent } from '../S3ViewerContent/S3ViewerContent.esm.js';
import { useEntity } from '@backstage/plugin-catalog-react';
import { S3_VIEWER_BUCKET } from '../../constant.esm.js';
import { extractBucketAndPath } from '../../utils.esm.js';

const S3ViewerPage = () => {
  const { entity } = useEntity();
  const s3ViewerAnnotations = entity.metadata?.annotations?.[S3_VIEWER_BUCKET];
  const { bucket, path } = extractBucketAndPath(s3ViewerAnnotations ?? "");
  return /* @__PURE__ */ jsx(Grid, { container: true, spacing: 3, children: /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(InfoCard, { children: /* @__PURE__ */ jsx(S3ViewerContent, { bucketName: bucket, pathFolder: path }) }) }) });
};

export { S3ViewerPage };
//# sourceMappingURL=S3ViewerPage.esm.js.map
