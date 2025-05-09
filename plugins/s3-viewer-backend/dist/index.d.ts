import * as _spreadshirt_backstage_plugin_s3_viewer_common from '@spreadshirt/backstage-plugin-s3-viewer-common';
import { ListBucketKeysResult, FetchObjectResult, BucketDetailsFilters, BucketDetails } from '@spreadshirt/backstage-plugin-s3-viewer-common';
import { Readable } from 'stream';
import { BucketsProvider, S3Api, CredentialsProvider, BucketStatsProvider } from '@spreadshirt/backstage-plugin-s3-viewer-node';
import * as _backstage_backend_plugin_api from '@backstage/backend-plugin-api';
import { DiscoveryService, AuthService, LoggerService, SchedulerService, PermissionsService, HttpAuthService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import { PolicyDecision } from '@backstage/plugin-permission-common';
import { HumanDuration } from '@backstage/types';
import * as _backstage_plugin_permission_common_index from '@backstage/plugin-permission-common/index';
import * as _backstage_plugin_permission_node from '@backstage/plugin-permission-node';

interface S3ClientEnvironment {
    discoveryApi: DiscoveryService;
    bucketsProvider: BucketsProvider;
}
declare class S3Client implements S3Api {
    private discoveryApi;
    private bucketsProvider;
    constructor({ bucketsProvider, discoveryApi }: S3ClientEnvironment);
    private getS3Client;
    listBucketKeys(endpoint: string, bucket: string, continuationToken: string, pageSize: number, folder: string, prefix: string): Promise<ListBucketKeysResult>;
    headObject(endpoint: string, bucket: string, key: string): Promise<FetchObjectResult>;
    streamObject(endpoint: string, bucket: string, key: string): Promise<Readable>;
    /**
     * Generates a URL to download a file from a bucket. It has an
     * expiration of 60 seconds for security reasons.
     *
     * @param endpoint Endpoint where the bucket is located
     * @param bucket The bucket name
     * @param key The key location, including it's full path
     * @returns The signed URL to download the file. Valid for 60 seconds
     */
    private getDownloadUrl;
}

interface S3Environment {
    auth: AuthService;
    logger: LoggerService;
    config: Config;
    scheduler: SchedulerService;
    discovery: DiscoveryService;
    permissions: PermissionsService;
    httpAuth: HttpAuthService;
}
interface S3BuilderReturn {
    router: express.Router;
}
declare class S3Builder {
    protected readonly env: S3Environment;
    private refreshInterval;
    private client?;
    private credentialsProvider?;
    private bucketsProvider?;
    private statsProvider?;
    constructor(env: S3Environment);
    static createBuilder(env: S3Environment): S3Builder;
    build(): Promise<S3BuilderReturn>;
    private buildCredentialsProvider;
    /**
     * Overwrites the current s3 client.
     *
     * @param client - The new S3 client
     * @returns
     */
    setClient(client: S3Api): this;
    /**
     * Overwrites the credentials provider.
     *
     * @param credentialsProvider - The new credentials provider
     * @returns
     */
    setCredentialsProvider(credentialsProvider: CredentialsProvider): this;
    /**
     * Overwrites the bucket provider.
     *
     * @param bucketsProvider - The new bucket provider
     * @returns
     */
    setBucketsProvider(bucketsProvider: BucketsProvider): this;
    /**
     * Sets a new bucket stats provider. By default this is undefined.
     *
     * @param bucketStatsProvider - The new bucket stats provider
     * @returns
     */
    setBucketStatsProvider(bucketStatsProvider: BucketStatsProvider): this;
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
    setRefreshInterval(refreshInterval: HumanDuration): this;
    /**
     * Analyzes the identity of the user that made the request and checks
     * for permissions to make such request. Throws an error if the request
     * is not authorized or the user has no permissions.
     *
     * @param request - The received request
     * @param permission - The permission to be checked by the backend
     * @returns The decision made by the backend
     */
    private evaluateRequest;
    /**
     * Parses the decision retuned by the permission backend into a bucket filter, which
     * is used in the bucketsProvider to return only the allowed buckets.
     *
     * @param decision - The decision returned by the permission backend
     * @returns The filter used if the decision is conditional. `undefined` otherwise
     */
    protected getBucketFilter(decision: PolicyDecision): BucketDetailsFilters | undefined;
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
    protected requireBucketPermission(endpoint: string, bucket: string, decision: PolicyDecision): void;
    /**
     * Builds the backend routes for S3.
     *
     * @param client - The S3 client used to list the secrets.
     * @returns The generated backend router
     */
    protected buildRouter(client: S3Api): express.Router;
}

declare const s3ViewerPlugin: _backstage_backend_plugin_api.BackendFeature;

declare const matches: (bucket: BucketDetails, filters?: BucketDetailsFilters) => boolean;

/**
 * @public
 */
declare const s3ViewerBucketConditions: _backstage_plugin_permission_node.Conditions<{
    isBucketOwner: _backstage_plugin_permission_node.PermissionRule<_spreadshirt_backstage_plugin_s3_viewer_common.BucketDetails, BucketDetailsFilters, "s3-viewer.bucket", undefined>;
    isBucketNamed: _backstage_plugin_permission_node.PermissionRule<_spreadshirt_backstage_plugin_s3_viewer_common.BucketDetails, BucketDetailsFilters, "s3-viewer.bucket", undefined>;
}>;
/**
 * @public
 */
declare const createS3ViewerBucketsConditionalDecision: (permission: _backstage_plugin_permission_common_index.ResourcePermission<"s3-viewer.bucket">, conditions: _backstage_plugin_permission_common_index.PermissionCriteria<_backstage_plugin_permission_common_index.PermissionCondition<"s3-viewer.bucket">>) => _backstage_plugin_permission_common_index.ConditionalPolicyDecision;

export { S3Builder, type S3BuilderReturn, S3Client, type S3ClientEnvironment, type S3Environment, createS3ViewerBucketsConditionalDecision, s3ViewerPlugin as default, matches, s3ViewerBucketConditions, s3ViewerPlugin };
