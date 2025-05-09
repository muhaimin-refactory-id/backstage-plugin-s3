import * as react_jsx_runtime from 'react/jsx-runtime';
import * as _backstage_core_plugin_api from '@backstage/core-plugin-api';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ListBucketKeysResult, BucketDetails, FetchObjectResult } from '@spreadshirt/backstage-plugin-s3-viewer-common';
import { Entity } from '@backstage/catalog-model';

declare const s3ViewerPlugin: _backstage_core_plugin_api.BackstagePlugin<{
    root: _backstage_core_plugin_api.RouteRef<{
        endpoint: string;
        bucket: string;
        "*": string;
    }>;
}, {}, {}>;
declare const S3ViewerPage: () => react_jsx_runtime.JSX.Element;

type BucketGroupRequest = {
    bucketName?: string;
};
type BucketRequest = {
    pathFolder?: string;
};

declare const S3ApiRef: _backstage_core_plugin_api.ApiRef<S3Api>;
interface S3Api {
    /**
     * Sets the cookie used by the plugin to authenticate users and allow them
     * to download and preview the data in S3.
     */
    setCookie(): Promise<void>;
    /**
     * List the keys for a bucket.
     * @param endpoint The endpoint where the bucket is
     * @param bucket The bucket name
     * @param continuationToken The continuation token to make pagination
     * @param pageSize The page size, which can be changed in the UI
     * @param folder The folder name where the keys are located
     * @param prefix The prefix to filter the listed keys
     */
    listBucketKeys(endpoint: string, bucket: string, continuationToken: string, pageSize: number, folder: string, prefix: string | undefined): Promise<ListBucketKeysResult>;
    /**
     * Returns all the bucket names found.
     */
    getAllBuckets(): Promise<string[]>;
    /**
     * Returns all the bucket names grouped by the endpoint where
     * they are located. Used for the tree view in the UI.
     */
    getGroupedBuckets(request?: BucketGroupRequest): Promise<Record<string, string[]>>;
    /**
     * Returns all the bucket names found for a certain endpoint.
     * @param endpoint The endpoint to fetch the bucket names
     */
    getBucketsByEndpoint(endpoint: string): Promise<string[]>;
    /**
     * Gets the bucket details or `undefined` if not found.
     * @param endpoint The endpoint where the bucket is located
     * @param bucket The bucket name to fetch info from
     */
    getBucketInfo(endpoint: string, bucket: string): Promise<BucketDetails>;
    /**
     * Gets an object metadata, including the link to stream its content.
     * @param endpoint The endpoint where the bucket is
     * @param bucket The bucket name
     * @param key The key to obtain the metadata
     */
    getObjectMetadata(endpoint: string, bucket: string, key: string): Promise<FetchObjectResult>;
}
declare class S3Client implements S3Api {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    constructor({ discoveryApi, fetchApi, }: {
        discoveryApi: DiscoveryApi;
        fetchApi: FetchApi;
    });
    private callApi;
    setCookie(): Promise<void>;
    listBucketKeys(endpoint: string, bucket: string, continuationToken: string, pageSize: number, folder: string, prefix: string | undefined): Promise<ListBucketKeysResult>;
    getAllBuckets(): Promise<string[]>;
    getBucketsByEndpoint(endpoint: string): Promise<string[]>;
    getGroupedBuckets(request?: BucketGroupRequest): Promise<Record<string, string[]>>;
    getBucketInfo(endpoint: string, bucket: string): Promise<BucketDetails>;
    getObjectMetadata(endpoint: string, bucket: string, key: string): Promise<FetchObjectResult>;
}

declare const isS3ViewerBucketAvailable: (entity: Entity) => boolean;

export { type BucketGroupRequest, type BucketRequest, type S3Api, S3ApiRef, S3Client, S3ViewerPage, isS3ViewerBucketAvailable, s3ViewerPlugin };
