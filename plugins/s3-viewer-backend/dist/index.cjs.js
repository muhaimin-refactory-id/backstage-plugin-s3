'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var S3Api = require('./service/S3Api.cjs.js');
var S3Builder = require('./service/S3Builder.cjs.js');
var plugin = require('./service/plugin.cjs.js');
require('./permissions/rules.cjs.js');
var ListBucketsFilter = require('./permissions/ListBucketsFilter.cjs.js');
var conditions = require('./permissions/conditions.cjs.js');



exports.S3Client = S3Api.S3Client;
exports.S3Builder = S3Builder.S3Builder;
exports.default = plugin.s3ViewerPlugin;
exports.s3ViewerPlugin = plugin.s3ViewerPlugin;
exports.matches = ListBucketsFilter.matches;
exports.createS3ViewerBucketsConditionalDecision = conditions.createS3ViewerBucketsConditionalDecision;
exports.s3ViewerBucketConditions = conditions.s3ViewerBucketConditions;
//# sourceMappingURL=index.cjs.js.map
