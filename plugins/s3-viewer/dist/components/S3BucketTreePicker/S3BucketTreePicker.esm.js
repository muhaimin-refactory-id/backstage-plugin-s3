import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect, Fragment } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { useApi } from '@backstage/core-plugin-api';
import { S3ApiRef } from '../../api.esm.js';
import { makeStyles, createStyles, Typography, List, ListItem, ListItemText, Collapse, Tooltip } from '@material-ui/core';
import { Progress } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles(
  (theme) => createStyles({
    list: {
      maxHeight: "80vh",
      overflow: "auto"
    },
    nested: {
      paddingLeft: theme.spacing(4)
    },
    endpoint: {
      cursor: "pointer"
    }
  })
);
const S3BucketTreePicker = ({
  state = { bucket: "", endpoint: "" },
  bucketName,
  pathFolder,
  updateTreeViewValues
}) => {
  const s3Api = useApi(S3ApiRef);
  const classes = useStyles();
  const [open, setOpen] = useState(state.endpoint);
  useEffect(() => {
    if (state.endpoint) {
      setOpen(state.endpoint);
    }
  }, [state.endpoint]);
  const handleCollapseClick = (value) => {
    if (open === value && open) {
      setOpen("");
    } else {
      setOpen(value);
    }
  };
  const {
    value: bucketsByEndpoint = {},
    loading,
    error
  } = useAsync(async () => {
    const groupedBuckets = await s3Api.getGroupedBuckets({ bucketName });
    const endpoints = Object.keys(groupedBuckets);
    if (!open && endpoints.length > 0) {
      setOpen(endpoints[0]);
    }
    return groupedBuckets;
  });
  if (loading) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (error) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: error.message });
  } else if (Object.keys(bucketsByEndpoint).length === 0) {
    return /* @__PURE__ */ jsx(Typography, { children: "No buckets found" });
  }
  const isSelected = (endpoint, bucket) => {
    return state.bucket === bucket && state.endpoint === endpoint;
  };
  return /* @__PURE__ */ jsx(List, { dense: true, className: classes.list, children: Object.entries(bucketsByEndpoint).map(
    ([endpointName, buckets], idxOne) => /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(
        ListItem,
        {
          className: classes.endpoint,
          onClick: () => handleCollapseClick(endpointName),
          children: [
            /* @__PURE__ */ jsx(ListItemText, { primary: endpointName }),
            open === endpointName ? /* @__PURE__ */ jsx(ExpandLess, {}) : /* @__PURE__ */ jsx(ExpandMore, {})
          ]
        }
      ),
      /* @__PURE__ */ jsx(Collapse, { in: open === endpointName, timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ jsx(List, { dense: true, disablePadding: true, children: buckets.map((bucketName2, idxTwo) => /* @__PURE__ */ jsx(
        ListItem,
        {
          button: true,
          className: classes.nested,
          component: "div",
          selected: isSelected(endpointName, bucketName2),
          onClick: () => {
            if (isSelected(endpointName, bucketName2)) {
              updateTreeViewValues("", "");
            } else {
              updateTreeViewValues(bucketName2, endpointName);
            }
          },
          children: /* @__PURE__ */ jsx(Tooltip, { title: bucketName2, children: /* @__PURE__ */ jsx(ListItemText, { primary: bucketName2 }) })
        },
        idxTwo
      )) }) })
    ] }, idxOne)
  ) });
};

export { S3BucketTreePicker };
//# sourceMappingURL=S3BucketTreePicker.esm.js.map
