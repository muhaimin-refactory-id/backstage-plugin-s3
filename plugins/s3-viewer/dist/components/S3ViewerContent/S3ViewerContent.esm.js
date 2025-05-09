import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import { useRef, useState, useCallback, useEffect } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { Content, Table } from '@backstage/core-components';
import { useApi, useRouteRefParams } from '@backstage/core-plugin-api';
import { makeStyles, createStyles, Grid, Typography } from '@material-ui/core';
import SubdirectoryArrowLeftIcon from '@material-ui/icons/SubdirectoryArrowLeft';
import { S3BucketTreePicker } from '../S3BucketTreePicker/S3BucketTreePicker.esm.js';
import { S3OverviewCard } from '../S3OverviewCard/S3OverviewCard.esm.js';
import { S3ApiRef } from '../../api.esm.js';
import { rootRouteRef } from '../../routes.esm.js';
import { getPathFromUrlDir, getFolderFromUrlDir } from '../../utils.esm.js';

const useStyles = makeStyles(
  () => createStyles({
    content: {
      width: "100%",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center"
    }
  })
);
const S3ViewerContent = ({
  bucketName,
  pathFolder
}) => {
  const s3Api = useApi(S3ApiRef);
  const classes = useStyles();
  const tableRef = useRef();
  const urlParams = useRouteRefParams(rootRouteRef);
  const [locationInfo, setLocationInfo] = useState({
    endpoint: urlParams.endpoint ?? "",
    bucket: urlParams.bucket ?? "",
    key: getPathFromUrlDir(
      urlParams["*"].replace(`${urlParams.endpoint}/${urlParams.bucket}`, "")
    ),
    folder: getFolderFromUrlDir(
      urlParams["*"].replace(`${urlParams.endpoint}/${urlParams.bucket}`, "")
    )
  });
  const [pageSize, setPageSize] = useState(20);
  const [token, setToken] = useState([""]);
  const columns = [
    {
      title: "Key",
      field: "name",
      render: (row) => /* @__PURE__ */ jsx(
        Typography,
        {
          onClick: () => {
            if (!row.isFolder) {
              setLocationInfo({
                bucket: locationInfo.bucket,
                endpoint: locationInfo.endpoint,
                key: locationInfo.folder + row.name,
                folder: locationInfo.folder
              });
            } else {
              setLocationInfo({
                bucket: locationInfo.bucket,
                endpoint: locationInfo.endpoint,
                key: locationInfo.key,
                folder: locationInfo.folder + row.name
              });
              setToken([""]);
              tableRef.current?.onQueryChange();
            }
          },
          style: { cursor: "pointer" },
          children: row.name
        }
      )
    }
  ];
  const {
    value: bucketInfo,
    loading: loadingBucketInfo,
    error: errorBucketInfo
  } = useAsync(async () => {
    if (!locationInfo.bucket || !locationInfo.endpoint) {
      return void 0;
    }
    return s3Api.getBucketInfo(locationInfo.endpoint, locationInfo.bucket);
  }, [locationInfo.endpoint, locationInfo.bucket]);
  const {
    value: objectInfo,
    loading: loadingObjectInfo,
    error: errorObjectInfo
  } = useAsync(async () => {
    if (!locationInfo.bucket || !locationInfo.endpoint || !locationInfo.key) {
      return void 0;
    }
    return s3Api.getObjectMetadata(
      locationInfo.endpoint,
      locationInfo.bucket,
      locationInfo.key
    );
  }, [locationInfo.endpoint, locationInfo.bucket, locationInfo.key]);
  const loadData = async (queryPage, queryPageSize, querySearch) => {
    const res = await s3Api.listBucketKeys(
      locationInfo.endpoint,
      locationInfo.bucket,
      token[queryPage],
      queryPageSize,
      locationInfo.folder,
      locationInfo.folder ? querySearch : pathFolder
    );
    const newToken = [...token];
    if (res.next) {
      newToken[queryPage + 1] = res.next;
      setToken(newToken);
    }
    const totalRows = queryPage * queryPageSize + res.keys.length;
    const totalCount = totalRows % queryPageSize === 0 ? res.totalBucketObjects : totalRows;
    return {
      data: res.keys,
      page: queryPage,
      totalCount
    };
  };
  const handleBackClicked = (_event) => {
    const folders = locationInfo.folder.split("/").filter((f) => f);
    let folderNew = "";
    if (folders.length > 1) {
      folderNew = `${folders.slice(0, folders.length - 1).join("/")}/`;
    }
    setLocationInfo({
      bucket: locationInfo.bucket,
      endpoint: locationInfo.endpoint,
      key: locationInfo.key,
      folder: folderNew
    });
    tableRef.current?.onQueryChange();
  };
  const updateTreeViewValues = useCallback(
    (newBucket, newEndpoint) => {
      setLocationInfo({
        endpoint: newEndpoint,
        bucket: newBucket,
        key: "",
        folder: ""
      });
      setToken([""]);
      tableRef.current?.onQueryChange();
    },
    []
  );
  useEffect(() => {
    setLocationInfo({
      endpoint: urlParams.endpoint ?? "",
      bucket: urlParams.bucket ?? "",
      key: getPathFromUrlDir(
        urlParams["*"].replace(`${urlParams.endpoint}/${urlParams.bucket}`, "")
      ),
      folder: getFolderFromUrlDir(
        urlParams["*"].replace(`${urlParams.endpoint}/${urlParams.bucket}`, "")
      )
    });
    tableRef.current?.onQueryChange();
  }, [urlParams, tableRef]);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(Content, { className: classes.content, noPadding: true, children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 1, children: [
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 2, children: /* @__PURE__ */ jsx(
      S3BucketTreePicker,
      {
        bucketName,
        pathFolder,
        state: { ...locationInfo },
        updateTreeViewValues
      }
    ) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 6, children: /* @__PURE__ */ jsx(
      Table,
      {
        tableRef,
        columns,
        actions: [
          {
            icon: () => /* @__PURE__ */ jsx(SubdirectoryArrowLeftIcon, {}),
            position: "row",
            disabled: !locationInfo.folder,
            tooltip: "Navigate Upwards",
            isFreeAction: true,
            onClick: handleBackClicked
          }
        ],
        data: async (query) => {
          if (!query || locationInfo.bucket === "") {
            return { data: [], page: 0, totalCount: 0 };
          } else if (token.length === 1) {
            query.page = 0;
            query.totalCount = 0;
          }
          return loadData(query.page, query.pageSize, query.search);
        },
        subtitle: locationInfo.folder && `Current directory: ${locationInfo.folder}`,
        onRowsPerPageChange: (newPageSize) => setPageSize(newPageSize),
        options: {
          sorting: false,
          paging: true,
          search: true,
          pageSize,
          pageSizeOptions: [20, 40, 80],
          padding: "dense",
          showFirstLastPageButtons: false,
          actionsColumnIndex: -1,
          emptyRowsWhenPaging: false
        }
      }
    ) }),
    /* @__PURE__ */ jsx(Grid, { item: true, xs: 4, children: /* @__PURE__ */ jsx(
      S3OverviewCard,
      {
        bucketInfo,
        loadingBucketInfo,
        errorBucketInfo,
        objectInfo,
        loadingObjectInfo,
        errorObjectInfo
      }
    ) })
  ] }) }) });
};

export { S3ViewerContent };
//# sourceMappingURL=S3ViewerContent.esm.js.map
