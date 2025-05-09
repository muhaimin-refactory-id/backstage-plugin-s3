import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { TabbedCard, CardTab } from '@backstage/core-components';
import { S3BucketViewer } from '../S3BucketViewer/S3BucketViewer.esm.js';
import { S3ObjectViewer } from '../S3ObjectViewer/S3ObjectViewer.esm.js';

const S3OverviewCard = (props) => {
  const [selectedTab, setSelectedTab] = useState("bucket");
  useEffect(() => {
    if (props.loadingObjectInfo || props.errorObjectInfo) {
      setSelectedTab("object");
    } else if (!props.objectInfo && !props.loadingObjectInfo) {
      setSelectedTab("bucket");
    }
  }, [props]);
  const handleChange = (_ev, newSelectedTab) => setSelectedTab(newSelectedTab);
  return /* @__PURE__ */ jsxs(TabbedCard, { value: selectedTab, onChange: handleChange, children: [
    /* @__PURE__ */ jsx(CardTab, { value: "bucket", label: "Bucket Details", children: /* @__PURE__ */ jsx(S3BucketViewer, { ...props }) }, "bucket-details"),
    /* @__PURE__ */ jsx(
      CardTab,
      {
        value: "object",
        disabled: !props.objectInfo && !props.loadingObjectInfo,
        label: "Object Details",
        children: /* @__PURE__ */ jsx(S3ObjectViewer, { ...props })
      },
      "object-details"
    )
  ] });
};

export { S3OverviewCard };
//# sourceMappingURL=S3OverviewCard.esm.js.map
