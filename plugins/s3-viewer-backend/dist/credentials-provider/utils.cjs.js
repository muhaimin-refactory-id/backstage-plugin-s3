'use strict';

var clientS3 = require('@aws-sdk/client-s3');

async function fetchBucketsForPlatform(platform, allowedBuckets) {
  const s3Client = new clientS3.S3({
    apiVersion: "2006-03-01",
    credentials: platform.credentials,
    endpoint: platform.endpoint,
    region: platform.region,
    forcePathStyle: true
  });
  const bucketList = await s3Client.listBuckets({});
  const buckets = bucketList.Buckets?.map((b) => b.Name || "").filter((b) => b).filter((b) => {
    const bucketsAllowed = allowedBuckets.find((a) => a.platform === platform.endpointName)?.buckets || [];
    if (bucketsAllowed.length === 0) {
      return true;
    }
    return bucketsAllowed.some((a) => {
      return b.match(`^${a}$`);
    });
  }) || [];
  return buckets;
}

exports.fetchBucketsForPlatform = fetchBucketsForPlatform;
//# sourceMappingURL=utils.cjs.js.map
