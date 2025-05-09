'use strict';

var clientS3 = require('@aws-sdk/client-s3');
var moment = require('moment');
var stream = require('stream');
var errors = require('@backstage/errors');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var moment__default = /*#__PURE__*/_interopDefaultCompat(moment);

class S3Client {
  discoveryApi;
  bucketsProvider;
  constructor({ bucketsProvider, discoveryApi }) {
    this.bucketsProvider = bucketsProvider;
    this.discoveryApi = discoveryApi;
  }
  getS3Client(endpoint, bucket) {
    const data = this.bucketsProvider.getCredentialsForBucket(endpoint, bucket);
    if (!data) {
      throw new Error(`No credentials stored for ${endpoint}/${bucket}`);
    }
    const s3Client = new clientS3.S3({
      apiVersion: "2006-03-01",
      credentials: data.credentials,
      endpoint: data.endpoint,
      region: data.region,
      forcePathStyle: true
    });
    return s3Client;
  }
  async listBucketKeys(endpoint, bucket, continuationToken, pageSize, folder, prefix) {
    const s3Client = this.getS3Client(endpoint, bucket);
    const bucketInfo = this.bucketsProvider.getBucketInfo(endpoint, bucket);
    const output = await s3Client.listObjects({
      Bucket: bucket,
      MaxKeys: pageSize,
      Marker: continuationToken,
      Prefix: folder + prefix,
      Delimiter: "/"
    }).catch((e) => {
      throw new Error(`Error listing keys: ${e.statusCode} ${e.code}`);
    });
    const keys = output.CommonPrefixes?.map((p) => ({
      name: p.Prefix?.substring(folder.length) || "",
      isFolder: true
    })).filter((k) => k.name !== "") || [];
    output.Contents?.forEach((c) => {
      if (c.Key) {
        keys.push({
          name: c.Key.substring(folder.length),
          isFolder: false
        });
      }
    });
    let totalObjects = bucketInfo?.objects ?? NaN;
    if (totalObjects === 0) {
      totalObjects = keys.length;
    }
    return {
      totalBucketObjects: output.IsTruncated ? totalObjects + 1 : totalObjects,
      keys,
      next: output.NextMarker
    };
  }
  async headObject(endpoint, bucket, key) {
    const s3Client = this.getS3Client(endpoint, bucket);
    const output = await s3Client.headObject({
      Bucket: bucket,
      Key: key
    }).catch((e) => {
      throw new Error(`Error fetching object: ${e.statusCode} ${e.code}`);
    });
    return {
      name: key,
      bucket,
      etag: output.ETag?.replace(/"+/g, "") || "",
      lastModified: moment__default.default(output.LastModified).utc().format("YYYY-MM-DD HH:mm:ss") || "unknown",
      contentLength: output.ContentLength,
      contentType: output.ContentType || "",
      downloadName: key.split("/").pop() || key,
      downloadUrl: await this.getDownloadUrl(endpoint, bucket, key)
    };
  }
  async streamObject(endpoint, bucket, key) {
    const s3Client = this.getS3Client(endpoint, bucket);
    const { Body: body } = await s3Client.send(
      new clientS3.GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );
    if (!body) {
      throw new errors.NotFoundError(`Key "${key}" not found in bucket "${bucket}"`);
    }
    if (body instanceof stream.Readable) {
      return body;
    }
    throw new Error("Unexpected stream received");
  }
  /**
   * Generates a URL to download a file from a bucket. It has an
   * expiration of 60 seconds for security reasons.
   *
   * @param endpoint Endpoint where the bucket is located
   * @param bucket The bucket name
   * @param key The key location, including it's full path
   * @returns The signed URL to download the file. Valid for 60 seconds
   */
  async getDownloadUrl(endpoint, bucket, key) {
    const s3Url = await this.discoveryApi.getExternalBaseUrl("s3-viewer");
    const url = new URL(
      `${s3Url}/stream/${encodeURIComponent(bucket)}/${encodeURIComponent(
        key
      )}?${new URLSearchParams({ endpoint })}`
    );
    return url.toString();
  }
}

exports.S3Client = S3Client;
//# sourceMappingURL=S3Api.cjs.js.map
