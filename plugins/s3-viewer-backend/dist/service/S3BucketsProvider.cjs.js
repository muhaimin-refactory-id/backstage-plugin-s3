'use strict';

var clientS3 = require('@aws-sdk/client-s3');
require('../permissions/rules.cjs.js');
var ListBucketsFilter = require('../permissions/ListBucketsFilter.cjs.js');
require('../permissions/conditions.cjs.js');

class S3BucketsProvider {
  constructor(logger, scheduler, credentialsProvider, statsProvider, schedule) {
    this.logger = logger;
    this.scheduler = scheduler;
    this.credentialsProvider = credentialsProvider;
    this.statsProvider = statsProvider;
    this.schedule = schedule;
    this.buckets = [];
    this.bucketCreds = [];
  }
  buckets;
  bucketCreds;
  static create(logger, scheduler, credentialsProvider, statsProvider, schedule) {
    const bucketsProvider = new S3BucketsProvider(
      logger,
      scheduler,
      credentialsProvider,
      statsProvider,
      schedule
    );
    bucketsProvider.start();
    return bucketsProvider;
  }
  async start() {
    await this.fetchBuckets();
    if (this.schedule) {
      await this.scheduler.scheduleTask({
        id: "refresh-s3-buckets",
        fn: async () => this.fetchBuckets(),
        frequency: this.schedule.frequency,
        timeout: this.schedule.timeout,
        initialDelay: this.schedule.initialDelay,
        scope: this.schedule.scope
      });
    }
  }
  async fetchBuckets() {
    this.logger.info("Fetching S3 buckets...");
    const bucketDetails = [];
    const bucketCredentials = await this.credentialsProvider.getBucketCredentials();
    await Promise.all(
      bucketCredentials.map(async (creds) => {
        try {
          const s3Client = new clientS3.S3({
            apiVersion: "2006-03-01",
            credentials: creds.credentials,
            endpoint: creds.endpoint,
            region: creds.region,
            forcePathStyle: true
          });
          const owner = await s3Client.getBucketAcl({ Bucket: creds.bucket });
          const details = {
            bucket: creds.bucket,
            owner: owner.Owner?.DisplayName || "",
            objects: 0,
            size: 0,
            endpoint: creds.endpoint,
            endpointName: creds.endpointName,
            policy: []
          };
          if (this.statsProvider) {
            try {
              const stats = await this.statsProvider.getStats(
                creds.endpoint,
                creds.bucket
              );
              details.objects = stats.objects;
              details.size = stats.size;
            } catch (err) {
              this.logger.error(
                `Could not fetch stats for ${creds.bucket} in ${creds.endpoint}: ${err}`
              );
            }
          }
          await s3Client.getBucketLifecycleConfiguration({
            Bucket: creds.bucket
          }).then((value) => details.policy = value.Rules || []).catch(
            // This catches an error if the lifecycle is not defined.
            // Just skip this error an continue processing
            (_) => {
            }
          );
          bucketDetails.push(details);
        } catch (err) {
          this.logger.error(
            `Error fetching data for bucket "${creds.bucket}", skipping. ${err}`
          );
        }
      })
    );
    this.buckets = bucketDetails;
    this.bucketCreds = bucketCredentials;
    this.logger.info(`Fetched ${this.buckets.length} S3 buckets`);
  }
  getAllBuckets(filter) {
    return this.buckets.filter((b) => ListBucketsFilter.matches(b, filter)).map((b) => b.bucket).sort();
  }
  getBucketsByEndpoint(endpoint, filter) {
    return this.buckets.filter((b) => ListBucketsFilter.matches(b, filter)).filter((b) => b.endpoint === endpoint || b.endpointName === endpoint).map((b) => b.bucket).sort();
  }
  getGroupedBuckets(filter) {
    const bucketsByEndpoint = {};
    this.buckets.filter((bucket) => ListBucketsFilter.matches(bucket, filter)).forEach((b) => {
      const endpoint = b.endpointName;
      if (!bucketsByEndpoint[endpoint]) {
        bucketsByEndpoint[endpoint] = [];
      }
      if (!bucketsByEndpoint[endpoint].includes(b.bucket)) {
        bucketsByEndpoint[endpoint].push(b.bucket);
      }
    });
    Object.keys(bucketsByEndpoint).forEach((key) => {
      bucketsByEndpoint[key] = bucketsByEndpoint[key].sort();
    });
    return bucketsByEndpoint;
  }
  getBucketInfo(endpoint, bucket) {
    return this.buckets.find(
      (b) => b.bucket === bucket && (b.endpoint === endpoint || b.endpointName === endpoint)
    );
  }
  getCredentialsForBucket(endpoint, bucket) {
    return this.bucketCreds.find(
      (b) => b.bucket === bucket && (b.endpoint === endpoint || b.endpointName === endpoint)
    );
  }
}

exports.S3BucketsProvider = S3BucketsProvider;
//# sourceMappingURL=S3BucketsProvider.cjs.js.map
