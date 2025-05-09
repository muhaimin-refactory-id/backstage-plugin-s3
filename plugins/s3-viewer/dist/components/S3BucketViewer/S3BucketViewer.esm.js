import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import Alert from '@material-ui/lab/Alert';
import { humanFileSize } from '../../utils.esm.js';
import { Typography, Divider, Grid } from '@material-ui/core';
import { Progress, StructuredMetadataTable } from '@backstage/core-components';

const S3BucketViewer = ({
  bucketInfo,
  loadingBucketInfo,
  errorBucketInfo
}) => {
  if (loadingBucketInfo) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (errorBucketInfo) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: errorBucketInfo.message });
  }
  const parsePolicy = (policy) => {
    const result = {};
    if (policy.ID) {
      result.ID = policy.ID;
    }
    if (policy.Status) {
      result.Status = policy.Status;
    }
    if (policy.Expiration) {
      result.Expiration = Object.entries(policy.Expiration).map(([key, value]) => `After ${value} ${key.toLowerCase()}`).join(", ");
    }
    const incompleteUpload = Object.values(
      policy.AbortIncompleteMultipartUpload || {}
    ).map((value) => `${value} days`).join("");
    result.AbortIncompleteMultipartUpload = incompleteUpload || "Not Set";
    return result;
  };
  const getBucketInfoMetadata = (data) => {
    if (!data) {
      return {};
    }
    const metadata = {
      Endpoint: data.endpoint,
      Owner: data.owner,
      Objects: data.objects,
      Size: `${humanFileSize(data.size)} (${data.size} bytes)`
    };
    if (data.policy.length > 0) {
      metadata.Lifecycle = parsePolicy(data.policy[0]);
    }
    return metadata;
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Typography, { variant: "h5", children: bucketInfo?.bucket || "" }),
    /* @__PURE__ */ jsx(Divider, { style: { marginTop: 20, marginBottom: 20 } }),
    /* @__PURE__ */ jsx(Grid, { container: true, children: /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(
      StructuredMetadataTable,
      {
        metadata: getBucketInfoMetadata(bucketInfo)
      }
    ) }) })
  ] });
};

export { S3BucketViewer };
//# sourceMappingURL=S3BucketViewer.esm.js.map
