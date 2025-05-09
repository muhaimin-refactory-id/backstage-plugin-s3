import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
import { makeStyles, createStyles, Typography, Divider, Grid, useTheme, useMediaQuery, Box, Button, Dialog, DialogTitle, IconButton, DialogContent } from '@material-ui/core';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import { humanFileSize } from '../../utils.esm.js';
import { Progress, StructuredMetadataTable, LinkButton } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles(
  () => createStyles({
    margin: {
      marginTop: "10px",
      marginBottom: "10px"
    },
    loading: {
      width: "90%"
    },
    preview: {
      textAlign: "center",
      maxWidth: "50%",
      maxHeight: "300px"
    }
  })
);
const S3Preview = ({ objectInfo }) => {
  const classes = useStyles();
  const isPreviewAvailable = (obj) => {
    if (!obj) {
      return false;
    }
    if (!obj.contentLength || obj.contentLength > 2e6) {
      return false;
    }
    if (![
      "image/gif",
      "image/jpeg",
      "image/svg+xml",
      "image/tiff",
      "image/x-icon",
      "image/jpg",
      "image/png"
    ].includes(obj.contentType) && // fall back to detecting based on file name if type is unknown
    !(["", "binary/octet-stream", "application/octet-stream"].includes(
      obj.contentType
    ) && obj.name.match(/\.(gif|ico|jpg|jpeg|png|svg|tiff)$/))) {
      return false;
    }
    return true;
  };
  const [isPreviewLoading, setIsPreviewLoading] = useState(
    isPreviewAvailable(objectInfo)
  );
  const [showVideo, setShowVideo] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  if (objectInfo?.contentType === "video/mp4") {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "contained",
          onClick: () => setShowVideo(true),
          startIcon: /* @__PURE__ */ jsx(OndemandVideoIcon, {}),
          children: "Play Video"
        }
      ) }),
      /* @__PURE__ */ jsxs(
        Dialog,
        {
          open: showVideo,
          onClose: () => setShowVideo(false),
          fullScreen,
          maxWidth: "md",
          fullWidth: true,
          children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: /* @__PURE__ */ jsxs(
              Box,
              {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Video Preview" }),
                  /* @__PURE__ */ jsx(
                    IconButton,
                    {
                      "aria-label": "close",
                      onClick: () => setShowVideo(false),
                      children: /* @__PURE__ */ jsx(CloseIcon, {})
                    }
                  )
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs(DialogContent, { dividers: true, children: [
              /* @__PURE__ */ jsxs(
                Box,
                {
                  component: "video",
                  controls: true,
                  autoPlay: true,
                  sx: {
                    width: "100%",
                    borderRadius: 2,
                    backgroundColor: "black"
                  },
                  children: [
                    /* @__PURE__ */ jsx("source", { src: objectInfo.downloadUrl, type: "video/mp4" }),
                    "Your browser does not support the video tag."
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(Box, { mt: 2, children: [
                /* @__PURE__ */ jsxs(Typography, { variant: "body2", color: "textSecondary", children: [
                  "File name: ",
                  objectInfo.name
                ] }),
                /* @__PURE__ */ jsxs(Typography, { variant: "body2", color: "textSecondary", children: [
                  "Content type: ",
                  objectInfo.contentType
                ] })
              ] })
            ] })
          ]
        }
      )
    ] });
  }
  if (!isPreviewAvailable(objectInfo) || !objectInfo) {
    return /* @__PURE__ */ jsx(Typography, { variant: "body2", children: "no preview available" });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isPreviewLoading && /* @__PURE__ */ jsx(Progress, { className: classes.loading }),
    /* @__PURE__ */ jsx(
      "img",
      {
        title: `Preview for "${objectInfo.downloadName}"`,
        alt: `Preview for "${objectInfo.downloadName}"`,
        src: objectInfo.downloadUrl,
        loading: "lazy",
        className: classes.preview,
        onLoad: () => setIsPreviewLoading(false),
        onError: () => setIsPreviewLoading(false)
      }
    )
  ] });
};
const S3ObjectViewer = ({
  objectInfo,
  loadingObjectInfo,
  errorObjectInfo
}) => {
  const classes = useStyles();
  if (loadingObjectInfo) {
    return /* @__PURE__ */ jsx(Progress, {});
  } else if (errorObjectInfo) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: errorObjectInfo.message });
  } else if (!objectInfo) {
    return /* @__PURE__ */ jsx(Alert, { severity: "error", children: "Object not found" });
  }
  const getMetadata = (params) => ({
    LastModified: params?.lastModified || "-",
    Size: params ? `${humanFileSize(params.contentLength)} (${params.contentLength} bytes)` : "-",
    ContentType: params?.contentType || "-",
    Etag: params?.etag || "-"
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Typography, { variant: "h5", children: objectInfo.name }),
    /* @__PURE__ */ jsx(Divider, { style: { marginTop: 20, marginBottom: 20 } }),
    /* @__PURE__ */ jsxs(Grid, { container: true, children: [
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(StructuredMetadataTable, { metadata: getMetadata(objectInfo) }) }),
      /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(Divider, { style: { marginTop: 20, marginBottom: 20 } }) }),
      /* @__PURE__ */ jsx(
        Grid,
        {
          container: true,
          direction: "column",
          alignItems: "center",
          justifyContent: "center",
          className: classes.margin,
          children: /* @__PURE__ */ jsx(S3Preview, { objectInfo })
        }
      ),
      /* @__PURE__ */ jsx(
        Grid,
        {
          container: true,
          direction: "column",
          alignItems: "center",
          justifyContent: "center",
          children: /* @__PURE__ */ jsx(Grid, { item: true, xs: 6, children: /* @__PURE__ */ jsx(
            LinkButton,
            {
              style: { textDecoration: "none" },
              variant: "outlined",
              title: `Download ${objectInfo.downloadName}`,
              to: objectInfo.downloadUrl,
              download: objectInfo.downloadName,
              children: "Download"
            }
          ) })
        }
      )
    ] })
  ] });
};

export { S3ObjectViewer, S3Preview };
//# sourceMappingURL=S3ObjectViewer.esm.js.map
