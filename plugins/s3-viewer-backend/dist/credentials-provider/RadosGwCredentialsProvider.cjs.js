'use strict';

var signatureV4 = require('@smithy/signature-v4');
var sha256Browser = require('@aws-crypto/sha256-browser');
var fetch = require('cross-fetch');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var fetch__default = /*#__PURE__*/_interopDefaultCompat(fetch);

class RadosGwCredentialsProvider {
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
        region: cfg.getString("region"),
        credentials: {
          accessKeyId: cfg.getString("accessKeyId"),
          secretAccessKey: cfg.getString("secretAccessKey")
        }
      };
    });
    return new RadosGwCredentialsProvider(platforms, logger, allowedBuckets);
  }
  async getBucketCredentials() {
    const bucketCreds = [];
    await Promise.all(
      this.platforms.map(async (platform) => {
        try {
          const signer = new signatureV4.SignatureV4({
            credentials: platform.credentials,
            region: platform.region,
            service: "s3",
            sha256: sha256Browser.Sha256
          });
          const bucketList = (await this.fetchBuckets(platform.endpoint, signer)).filter((b) => {
            const allowedBuckets = this.allowedBuckets.find(
              (a) => a.platform === platform.endpointName
            )?.buckets || [];
            if (allowedBuckets.length === 0) {
              return true;
            }
            return allowedBuckets.some((a) => {
              return b.match(`^${a}$`);
            });
          });
          await Promise.all(
            bucketList.map(async (bucket) => {
              const bucketOwner = await this.getBucketOwner(
                platform.endpoint,
                bucket,
                signer
              );
              const result = await this.fetchUserInfo(
                platform.endpoint,
                bucketOwner,
                signer
              );
              const ownerCreds = result.keys.find((k) => k.user === bucketOwner);
              if (!ownerCreds) {
                return;
              }
              bucketCreds.push({
                bucket,
                credentials: {
                  accessKeyId: ownerCreds.access_key,
                  secretAccessKey: ownerCreds.secret_key
                },
                endpoint: platform.endpoint,
                endpointName: platform.endpointName,
                region: platform.region
              });
            })
          );
        } catch (err) {
          this.logger.error(
            `Error fetching credentials for buckets in ${platform.endpoint}: ${err}`
          );
        }
      })
    );
    return bucketCreds;
  }
  async fetchBuckets(endpoint, signer) {
    const url = new URL(`${endpoint}/admin/bucket?format=json`);
    const request = await signer.sign(
      {
        protocol: "http",
        hostname: url.hostname.toString(),
        path: url.pathname.toString(),
        method: "GET",
        query: Object.fromEntries(new URLSearchParams(url.search.substring(1)))
      },
      {}
    );
    const response = await fetch__default.default(url.toString(), request);
    if (!response.ok) {
      throw new Error(
        `Error fetching buckets from radosgw: ${response.statusText}`
      );
    }
    return await response.json();
  }
  async getBucketOwner(endpoint, bucket, signer) {
    const url = new URL(
      `${endpoint}/admin/bucket?bucket=${bucket}&format=json`
    );
    const request = await signer.sign(
      {
        protocol: "http",
        hostname: url.hostname.toString(),
        path: url.pathname.toString(),
        method: "GET",
        query: Object.fromEntries(new URLSearchParams(url.search.substring(1)))
      },
      {}
    );
    const response = await fetch__default.default(url.toString(), request);
    if (!response.ok) {
      throw new Error(
        `Error fetching buckets from radosgw: ${response.statusText}`
      );
    }
    const bucketInfo = await response.json();
    return bucketInfo.owner;
  }
  async fetchUserInfo(endpoint, user, signer) {
    const url = new URL(`${endpoint}/admin/user?format=json&uid=${user}`);
    const request = await signer.sign(
      {
        protocol: "http",
        hostname: url.hostname.toString(),
        path: url.pathname.toString(),
        method: "GET",
        query: Object.fromEntries(new URLSearchParams(url.search.substring(1)))
      },
      {}
    );
    const response = await fetch__default.default(url.toString(), request);
    if (!response.ok) {
      throw new Error(
        `Error fetching user info from radosgw: ${response.statusText}`
      );
    }
    return await response.json();
  }
}

exports.RadosGwCredentialsProvider = RadosGwCredentialsProvider;
//# sourceMappingURL=RadosGwCredentialsProvider.cjs.js.map
