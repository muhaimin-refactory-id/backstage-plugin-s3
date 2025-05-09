'use strict';

var ConfigCredentialsProvider = require('./ConfigCredentialsProvider.cjs.js');
var RadosGwCredentialsProvider = require('./RadosGwCredentialsProvider.cjs.js');
var IAMRoleCredentialsProvider = require('./IAMRoleCredentialsProvider.cjs.js');

class CombinedCredentialsProvider {
  constructor(credentialsProviders) {
    this.credentialsProviders = credentialsProviders;
  }
  async getBucketCredentials() {
    return await Promise.all(
      this.credentialsProviders.map(
        async (locator) => locator.getBucketCredentials()
      )
    ).then((res) => {
      return res.flat();
    }).catch((e) => {
      throw e;
    });
  }
}
const getCombinedCredentialsProvider = (rootConfig, logger) => {
  const allowedBuckets = [];
  rootConfig.getOptionalConfigArray("s3.allowedBuckets")?.forEach(
    (c) => allowedBuckets.push({
      platform: c.getString("platform"),
      buckets: c.getStringArray("buckets")
    })
  );
  const credentialsProvider = rootConfig.getConfigArray("s3.bucketLocatorMethods").map((clusterLocatorMethod) => {
    const type = clusterLocatorMethod.getString("type");
    switch (type) {
      case "config":
        return ConfigCredentialsProvider.ConfigCredentialsProvider.fromConfig(
          clusterLocatorMethod,
          logger,
          allowedBuckets
        );
      case "radosgw-admin":
        return RadosGwCredentialsProvider.RadosGwCredentialsProvider.fromConfig(
          clusterLocatorMethod,
          logger,
          allowedBuckets
        );
      case "iam-role":
        return IAMRoleCredentialsProvider.IAMRoleCredentialsProvider.fromConfig(
          clusterLocatorMethod,
          logger,
          allowedBuckets
        );
      default:
        throw new Error(`Unsupported s3.bucketLocatorMethods: "${type}"`);
    }
  });
  return new CombinedCredentialsProvider(credentialsProvider);
};

exports.getCombinedCredentialsProvider = getCombinedCredentialsProvider;
//# sourceMappingURL=index.cjs.js.map
