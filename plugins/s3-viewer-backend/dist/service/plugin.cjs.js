'use strict';

var backstagePluginS3ViewerNode = require('@spreadshirt/backstage-plugin-s3-viewer-node');
var backendPluginApi = require('@backstage/backend-plugin-api');
var S3Builder = require('./S3Builder.cjs.js');

const s3ViewerPlugin = backendPluginApi.createBackendPlugin({
  pluginId: "s3-viewer",
  register(env) {
    let s3Client;
    let s3CredentialsProvider;
    let s3BucketsProvider;
    let s3BucketStatsProvider;
    env.registerExtensionPoint(backstagePluginS3ViewerNode.s3ViewerExtensionPoint, {
      setClient(client) {
        if (s3Client !== void 0) {
          throw new Error("A S3 client has been already set");
        }
        s3Client = client;
      },
      setCredentialsProvider(credentialsProvider) {
        if (s3CredentialsProvider !== void 0) {
          throw new Error("A credentials provider has been already set");
        }
        s3CredentialsProvider = credentialsProvider;
      },
      setBucketsProvider(bucketsProvider) {
        if (s3BucketsProvider !== void 0) {
          throw new Error("A buckets provider has been already set");
        }
        s3BucketsProvider = bucketsProvider;
      },
      setBucketStatsProvider(bucketStatsProvider) {
        if (s3BucketStatsProvider !== void 0) {
          throw new Error("A bucket stats provider has been already set");
        }
        s3BucketStatsProvider = bucketStatsProvider;
      }
    });
    env.registerInit({
      deps: {
        auth: backendPluginApi.coreServices.auth,
        logger: backendPluginApi.coreServices.logger,
        config: backendPluginApi.coreServices.rootConfig,
        scheduler: backendPluginApi.coreServices.scheduler,
        discovery: backendPluginApi.coreServices.discovery,
        permissions: backendPluginApi.coreServices.permissions,
        httpAuth: backendPluginApi.coreServices.httpAuth,
        httpRouter: backendPluginApi.coreServices.httpRouter
      },
      async init(deps) {
        let builder = S3Builder.S3Builder.createBuilder(deps);
        if (s3Client) {
          builder = builder.setClient(s3Client);
        }
        if (s3CredentialsProvider) {
          builder = builder.setCredentialsProvider(s3CredentialsProvider);
        }
        if (s3BucketsProvider) {
          builder = builder.setBucketsProvider(s3BucketsProvider);
        }
        if (s3BucketStatsProvider) {
          builder = builder.setBucketStatsProvider(s3BucketStatsProvider);
        }
        const { router } = await builder.build();
        deps.httpRouter.use(router);
        deps.httpRouter.addAuthPolicy({
          path: "/stream",
          allow: "user-cookie"
        });
      }
    });
  }
});

exports.s3ViewerPlugin = s3ViewerPlugin;
//# sourceMappingURL=plugin.cjs.js.map
