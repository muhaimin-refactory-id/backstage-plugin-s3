'use strict';

var express = require('express');
var Router = require('express-promise-router');
var S3BucketsProvider = require('./S3BucketsProvider.cjs.js');
var S3Api = require('./S3Api.cjs.js');
var backendPluginApi = require('@backstage/backend-plugin-api');
var errors = require('@backstage/errors');
var pluginPermissionCommon = require('@backstage/plugin-permission-common');
var backstagePluginS3ViewerCommon = require('@spreadshirt/backstage-plugin-s3-viewer-common');
var index = require('../credentials-provider/index.cjs.js');
var cookieParser = require('cookie-parser');
require('../permissions/rules.cjs.js');
var ListBucketsFilter = require('../permissions/ListBucketsFilter.cjs.js');
var conditions = require('../permissions/conditions.cjs.js');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var express__default = /*#__PURE__*/_interopDefaultCompat(express);
var Router__default = /*#__PURE__*/_interopDefaultCompat(Router);
var cookieParser__default = /*#__PURE__*/_interopDefaultCompat(cookieParser);

class S3Builder {
  constructor(env) {
    this.env = env;
  }
  refreshInterval;
  client;
  credentialsProvider;
  bucketsProvider;
  statsProvider;
  static createBuilder(env) {
    return new S3Builder(env);
  }
  async build() {
    const { logger, config, scheduler, discovery } = this.env;
    logger.info("Initializing S3 backend");
    if (!config.has("s3")) {
      logger.warn("Failed to initialize S3 backend: s3 config is missing");
      return {
        router: Router__default.default()
      };
    }
    const fallbackSchedule = this.refreshInterval ? { frequency: this.refreshInterval, timeout: this.refreshInterval } : void 0;
    const schedule = config.has("s3.bucketRefreshSchedule") ? backendPluginApi.readSchedulerServiceTaskScheduleDefinitionFromConfig(
      config.getConfig("s3.bucketRefreshSchedule")
    ) : fallbackSchedule;
    const credentialsProvider = this.credentialsProvider ?? this.buildCredentialsProvider();
    this.bucketsProvider = this.bucketsProvider ?? S3BucketsProvider.S3BucketsProvider.create(
      logger,
      scheduler,
      credentialsProvider,
      this.statsProvider,
      schedule
    );
    this.client = this.client ?? new S3Api.S3Client({
      bucketsProvider: this.bucketsProvider,
      discoveryApi: discovery
    });
    if (this.client.setBucketsProvider) {
      this.client.setBucketsProvider(this.bucketsProvider);
    }
    const router = this.buildRouter(this.client);
    return {
      router
    };
  }
  buildCredentialsProvider() {
    return index.getCombinedCredentialsProvider(this.env.config, this.env.logger);
  }
  /**
   * Overwrites the current s3 client.
   *
   * @param client - The new S3 client
   * @returns
   */
  setClient(client) {
    this.client = client;
    return this;
  }
  /**
   * Overwrites the credentials provider.
   *
   * @param credentialsProvider - The new credentials provider
   * @returns
   */
  setCredentialsProvider(credentialsProvider) {
    this.credentialsProvider = credentialsProvider;
    return this;
  }
  /**
   * Overwrites the bucket provider.
   *
   * @param bucketsProvider - The new bucket provider
   * @returns
   */
  setBucketsProvider(bucketsProvider) {
    this.bucketsProvider = bucketsProvider;
    return this;
  }
  /**
   * Sets a new bucket stats provider. By default this is undefined.
   *
   * @param bucketStatsProvider - The new bucket stats provider
   * @returns
   */
  setBucketStatsProvider(bucketStatsProvider) {
    this.statsProvider = bucketStatsProvider;
    return this;
  }
  /**
   * Sets the refresh interval for the radosgw-admin provider.
   * By default, the refresh is not enabled, set this value to
   * allow reloading the buckets.
   *
   * @param refreshInterval - The refresh interval to reload buckets
   * @returns
   * @deprecated Now the refresh interval is set via the app-config.yaml file.
   * Define `s3.bucketRefreshSchedule` in your configuration file.
   */
  setRefreshInterval(refreshInterval) {
    this.env.logger.warn(
      "The method setRefreshInterval is deprecated. Please define the refresh interval via the config file in 's3.bucketRefreshSchedule' instead"
    );
    this.refreshInterval = refreshInterval;
    return this;
  }
  /**
   * Analyzes the identity of the user that made the request and checks
   * for permissions to make such request. Throws an error if the request
   * is not authorized or the user has no permissions.
   *
   * @param request - The received request
   * @param permission - The permission to be checked by the backend
   * @returns The decision made by the backend
   */
  async evaluateRequest(request, permission) {
    const credentials = await this.env.httpAuth.credentials(request, {
      allowLimitedAccess: true
    });
    const decision = (await this.env.permissions.authorizeConditional([permission], {
      credentials
    }))[0];
    if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
      throw new errors.NotAllowedError("Unauthorized");
    }
    return { decision };
  }
  /**
   * Parses the decision retuned by the permission backend into a bucket filter, which
   * is used in the bucketsProvider to return only the allowed buckets.
   *
   * @param decision - The decision returned by the permission backend
   * @returns The filter used if the decision is conditional. `undefined` otherwise
   */
  getBucketFilter(decision) {
    if (decision.result !== pluginPermissionCommon.AuthorizeResult.CONDITIONAL) {
      return void 0;
    }
    return conditions.transformConditions(decision.conditions);
  }
  /**
   * Receives the decision made and checks if the user is allowed to make such request.
   *
   * It throws an error if the bucket is not found or if the user is not
   * authorized to request data for a certain bucket.
   *
   * @param endpoint - The endpoint where the bucket is
   * @param bucket - The bucket name
   * @param decision - The decision returned by the permission backend
   */
  requireBucketPermission(endpoint, bucket, decision) {
    const bucketInfo = this.bucketsProvider?.getBucketInfo(endpoint, bucket);
    if (!bucketInfo) {
      throw new errors.NotFoundError();
    }
    const filter = this.getBucketFilter(decision);
    if (!ListBucketsFilter.matches(bucketInfo, filter)) {
      throw new errors.NotAllowedError();
    }
  }
  /**
   * Builds the backend routes for S3.
   *
   * @param client - The S3 client used to list the secrets.
   * @returns The generated backend router
   */
  buildRouter(client) {
    const router = Router__default.default();
    router.use(express__default.default.json());
    router.use(cookieParser__default.default());
    router.get("/health", (_, res) => {
      res.json({ status: "ok" });
    });
    router.get("/cookie", async (req, res) => {
      const credentials = await this.env.httpAuth.credentials(req, {
        allowLimitedAccess: true,
        allow: ["user"]
      });
      const { expiresAt } = await this.env.httpAuth.issueUserCookie(res, {
        credentials
      });
      res.status(200).json({ expiresAt: expiresAt.toISOString() });
    });
    router.get("/buckets", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3BucketList
      });
      const filter = this.getBucketFilter(decision);
      const buckets = this.bucketsProvider?.getAllBuckets(filter);
      if (!buckets) {
        throw new errors.NotFoundError();
      }
      res.json(buckets);
    });
    router.get("/buckets/by-endpoint", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3BucketList
      });
      const filter = this.getBucketFilter(decision);
      const { endpoint } = req.query;
      const bucketsByEndpoint = this.bucketsProvider?.getBucketsByEndpoint(
        endpoint,
        filter
      );
      if (!bucketsByEndpoint) {
        throw new errors.NotFoundError();
      }
      res.json(bucketsByEndpoint);
    });
    router.get("/buckets/grouped", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3BucketList
      });
      const { bucketName } = req.query;
      const permissionFilter = this.getBucketFilter(decision);
      const paramFilters = [];
      if (bucketName) {
        paramFilters.push({
          property: "bucket",
          values: [bucketName.toString()]
        });
      }
      const finalFilter = {
        allOf: [
          ...paramFilters.length ? [{ allOf: paramFilters }] : [],
          ...permissionFilter ? [permissionFilter] : []
        ]
      };
      const groupedBuckets = this.bucketsProvider?.getGroupedBuckets(finalFilter);
      if (!groupedBuckets) {
        throw new errors.NotFoundError();
      }
      res.json(groupedBuckets);
    });
    router.get("/bucket/:bucket", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3BucketRead
      });
      const { bucket } = req.params;
      const { endpoint } = req.query;
      const bucketInfo = this.bucketsProvider?.getBucketInfo(
        endpoint,
        bucket
      );
      if (!bucketInfo) {
        throw new errors.NotFoundError();
      }
      const filter = this.getBucketFilter(decision);
      if (!ListBucketsFilter.matches(bucketInfo, filter)) {
        throw new errors.NotAllowedError();
      }
      res.json(bucketInfo);
    });
    router.get("/bucket/:bucket/keys", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3BucketRead
      });
      const { bucket } = req.params;
      const { continuationToken, pageSize, folder, prefix, endpoint } = req.query;
      this.requireBucketPermission(endpoint, bucket, decision);
      const keys = await client.listBucketKeys(
        endpoint,
        bucket,
        continuationToken,
        Number(pageSize),
        folder,
        prefix
      );
      res.json(keys);
    });
    router.get("/bucket/:bucket/:key", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3ObjectRead
      });
      const { bucket, key } = req.params;
      const { endpoint } = req.query;
      this.requireBucketPermission(endpoint, bucket, decision);
      const object = await client.headObject(endpoint, bucket, key);
      res.json(object);
    });
    router.get("/stream/:bucket/:key", async (req, res) => {
      const { decision } = await this.evaluateRequest(req, {
        permission: backstagePluginS3ViewerCommon.permissions.s3ObjectDownload
      });
      const { bucket, key } = req.params;
      const { endpoint } = req.query;
      this.requireBucketPermission(endpoint, bucket, decision);
      const object = await client.headObject(endpoint, bucket, key);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${object.downloadName}"`
      );
      res.setHeader("Content-Type", object.contentType);
      if (object.contentLength) {
        res.setHeader("Content-Length", object.contentLength);
      }
      const body = await client.streamObject(endpoint, bucket, key);
      body.on("error", (err) => {
        errors.assertError(err);
        this.env.logger.error(err.message);
        res.status(400).send(err.message);
      });
      body.on("data", (data) => res.write(data));
      body.on("end", () => res.send());
    });
    return router;
  }
}

exports.S3Builder = S3Builder;
//# sourceMappingURL=S3Builder.cjs.js.map
