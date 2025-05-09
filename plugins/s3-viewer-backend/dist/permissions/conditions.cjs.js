'use strict';

var pluginPermissionNode = require('@backstage/plugin-permission-node');
var backstagePluginS3ViewerCommon = require('@spreadshirt/backstage-plugin-s3-viewer-common');
var rules = require('./rules.cjs.js');

const { conditions, createConditionalDecision } = pluginPermissionNode.createConditionExports({
  pluginId: "s3-viewer",
  resourceType: backstagePluginS3ViewerCommon.S3_VIEWER_RESOURCE_TYPE,
  rules: rules.rules
});
const s3ViewerBucketConditions = conditions;
const createS3ViewerBucketsConditionalDecision = createConditionalDecision;
const transformConditions = pluginPermissionNode.createConditionTransformer(Object.values(rules.rules));

exports.createS3ViewerBucketsConditionalDecision = createS3ViewerBucketsConditionalDecision;
exports.s3ViewerBucketConditions = s3ViewerBucketConditions;
exports.transformConditions = transformConditions;
//# sourceMappingURL=conditions.cjs.js.map
