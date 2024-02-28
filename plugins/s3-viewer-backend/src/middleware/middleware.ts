import { getBearerTokenFromAuthorizationHeader } from '@backstage/plugin-auth-node';
import express from 'express';
import { decodeJwt } from 'jose';
import { URL } from 'url';
import {
  IdentityService,
  RootConfigService,
  TokenManagerService,
} from '@backstage/backend-plugin-api';

// Based on the code in https://github.com/backstage/backstage/blob/master/contrib/docs/tutorials/authenticate-api-requests.md

function setTokenCookie(
  res: express.Response,
  options: { token: string; secure: boolean; cookieDomain: string },
) {
  try {
    const payload = decodeJwt(options.token);
    res.cookie('s3_viewer_token', options.token, {
      expires: new Date(payload.exp ? payload.exp * 1000 : 0),
      secure: options.secure,
      sameSite: 'lax',
      domain: options.cookieDomain,
      path: '/',
      httpOnly: true,
    });
  } catch (_err) {
    // Ignore
  }
}

/**
 * A middleware implementation that only forwards the requests. To allow
 * the user `guest` to make requests to the backend.
 */
export const noopMiddleware = () => {
  const s3Middleware: express.RequestHandler = async (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    next();
  };
  return s3Middleware;
};

type S3MiddlewareProps = {
  config: RootConfigService;
  identity: IdentityService;
  tokenManager: TokenManagerService;
};

export const s3Middleware = async (opts: S3MiddlewareProps) => {
  const { config, identity, tokenManager } = opts;
  const baseUrl = config.getString('backend.baseUrl');
  const secure = baseUrl.startsWith('https://');
  const cookieDomain = new URL(baseUrl).hostname;
  const middleware: express.RequestHandler = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const token =
        getBearerTokenFromAuthorizationHeader(req.headers.authorization) ||
        (req.cookies?.s3_viewer_token as string | undefined);
      if (!token) {
        res.status(401).send('Unauthorized');
        return;
      }
      try {
        const user = (await identity.getIdentity({ request: req }))?.identity
          .userEntityRef;
        if (!req.headers.user) {
          req.headers.user = user;
        }
      } catch {
        await tokenManager.authenticate(token);
      }
      if (!req.headers.authorization) {
        // Authorization header may be forwarded by plugin requests
        req.headers.authorization = `Bearer ${token}`;
      }
      if (token && token !== req.cookies?.s3_viewer_token) {
        setTokenCookie(res, {
          token,
          secure,
          cookieDomain,
        });
      }
      next();
    } catch (error) {
      res.status(401).send('Unauthorized');
    }
  };
  return middleware;
};
