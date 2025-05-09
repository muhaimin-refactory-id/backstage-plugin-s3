import { createApiRef } from '@backstage/core-plugin-api';

const S3ApiRef = createApiRef({
  id: "plugin.s3.service"
});
class S3Client {
  discoveryApi;
  fetchApi;
  constructor({
    discoveryApi,
    fetchApi
  }) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }
  async callApi(path, query) {
    const apiUrl = await this.discoveryApi.getBaseUrl("s3-viewer");
    const response = await this.fetchApi.fetch(
      `${apiUrl}/${path}?${new URLSearchParams(query).toString()}`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );
    if (!response.ok) {
      throw new Error(
        `Request failed for ${path}, ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  }
  async setCookie() {
    const apiUrl = await this.discoveryApi.getBaseUrl("s3-viewer");
    await this.fetchApi.fetch(`${apiUrl}/cookie`, { credentials: "include" });
  }
  async listBucketKeys(endpoint, bucket, continuationToken, pageSize, folder, prefix) {
    const result = await this.callApi(
      `bucket/${encodeURIComponent(bucket)}/keys`,
      {
        endpoint,
        continuationToken,
        pageSize,
        folder,
        prefix
      }
    );
    return result;
  }
  async getAllBuckets() {
    const result = await this.callApi("buckets", {});
    return result;
  }
  async getBucketsByEndpoint(endpoint) {
    const result = await this.callApi("buckets/by-endpoint", {
      endpoint
    });
    return result;
  }
  async getGroupedBuckets(request) {
    const result = await this.callApi(
      "buckets/grouped",
      request ?? {}
    );
    return result;
  }
  async getBucketInfo(endpoint, bucket) {
    const result = await this.callApi(
      `bucket/${encodeURIComponent(bucket)}`,
      { endpoint }
    );
    return result;
  }
  async getObjectMetadata(endpoint, bucket, key) {
    const result = await this.callApi(
      `bucket/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`,
      { endpoint }
    );
    return result;
  }
}

export { S3ApiRef, S3Client };
//# sourceMappingURL=api.esm.js.map
