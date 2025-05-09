'use strict';

var utils = require('./utils.cjs.js');

class IAMRoleCredentialsProvider {
  constructor(platforms, logger, allowedBuckets) {
    this.platforms = platforms;
    this.logger = logger;
    this.allowedBuckets = allowedBuckets;
  }
  static fromConfig(config, logger, allowedBuckets) {
    const platforms = config.getConfigArray("platforms").map((cfg) => {
      const name = cfg.getOptionalString("name") || cfg.getString("endpoint");
      return {
        endpoint: cfg.getString("endpoint"),
        endpointName: name,
        region: cfg.getString("region")
      };
    });
    return new IAMRoleCredentialsProvider(platforms, logger, allowedBuckets);
  }
  async getBucketCredentials() {
    const bucketCreds = [];
    await Promise.all(
      this.platforms.map(async (platform) => {
        try {
          const buckets = await utils.fetchBucketsForPlatform(
            platform,
            this.allowedBuckets
          );
          const creds = buckets.map((b) => ({
            bucket: b,
            endpoint: platform.endpoint,
            endpointName: platform.endpointName,
            region: platform.region
          }));
          bucketCreds.push(...creds);
        } catch (err) {
          this.logger.error(
            `Error fetching credentials for buckets in ${platform.endpoint}: ${err}`
          );
        }
      })
    );
    return bucketCreds;
  }
}

exports.IAMRoleCredentialsProvider = IAMRoleCredentialsProvider;
//# sourceMappingURL=IAMRoleCredentialsProvider.cjs.js.map
