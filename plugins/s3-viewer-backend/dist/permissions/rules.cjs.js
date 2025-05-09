'use strict';

var pluginPermissionNode = require('@backstage/plugin-permission-node');
var backstagePluginS3ViewerCommon = require('@spreadshirt/backstage-plugin-s3-viewer-common');
var zod = require('zod');

const createS3ViewerBucketPermissionRule = pluginPermissionNode.makeCreatePermissionRule();
const isBucketOwner = createS3ViewerBucketPermissionRule({
  name: "IS_BUCKET_OWNER",
  description: "Should allow only if the bucket belongs to the user",
  resourceType: backstagePluginS3ViewerCommon.S3_VIEWER_RESOURCE_TYPE,
  paramsSchema: zod.z.object({
    owners: zod.z.array(zod.z.string()).describe("List of owner entity refs")
  }),
  apply: (list, { owners }) => owners.includes(list.owner),
  toQuery: ({ owners }) => ({
    property: "owner",
    values: owners
  })
});
const isBucketNamed = createS3ViewerBucketPermissionRule({
  name: "IS_BUCKET_NAMED",
  description: "Should allow only depending on the bucket name",
  resourceType: backstagePluginS3ViewerCommon.S3_VIEWER_RESOURCE_TYPE,
  paramsSchema: zod.z.object({
    names: zod.z.array(zod.z.string()).describe("List of bucket names")
  }),
  apply: (list, { names }) => names.includes(list.bucket),
  toQuery: ({ names }) => ({
    property: "bucket",
    values: names
  })
});
const rules = { isBucketOwner, isBucketNamed };

exports.rules = rules;
//# sourceMappingURL=rules.cjs.js.map
