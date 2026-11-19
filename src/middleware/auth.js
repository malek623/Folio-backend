import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { HttpError } from "../utils/httpError.js";

// ---------- 1) Local JWT (issued by POST /api/auth/login) ----------
function verifyLocalJwt(token) {
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    return { id: p.sub, email: p.email, provider: "local" };
  } catch {
    return null;
  }
}

// ---------- 2) OAuth 2.0 / OpenID Connect token (issued by an external provider) ----------
let jwks; // created lazily, keys are cached by jose

async function verifyOAuthToken(token) {
  const { OAUTH_ISSUER, OAUTH_JWKS_URI, OAUTH_CLIENT_ID, OAUTH_USERINFO_URL } = process.env;

  // a) token is a signed JWT (e.g. an OIDC id_token): verify signature, issuer, audience, expiry
  if (OAUTH_JWKS_URI && OAUTH_ISSUER && token.split(".").length === 3) {
    try {
      jwks ??= createRemoteJWKSet(new URL(OAUTH_JWKS_URI));
      const { payload } = await jwtVerify(token, jwks, {
        issuer: OAUTH_ISSUER,
        ...(OAUTH_CLIENT_ID && { audience: OAUTH_CLIENT_ID }),
      });
      return { id: payload.sub, email: payload.email, provider: "oauth" };
    } catch {
      /* fall through to userinfo */
    }
  }

  // b) opaque access token (e.g. Google): ask the provider who it belongs to
  if (OAUTH_USERINFO_URL) {
    try {
      const r = await fetch(OAUTH_USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const info = await r.json();
        if (info.sub) return { id: info.sub, email: info.email, provider: "oauth" };
      }
    } catch {
      /* provider unreachable -> treat as invalid */
    }
  }
  return null;
}

// ---------- Middleware: Authorization: Bearer <token> ----------
export async function requireAuth(req, _res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new HttpError(401, "Authentication required: send 'Authorization: Bearer <token>'");
    }

    const user = verifyLocalJwt(token) || (await verifyOAuthToken(token));
    if (!user) throw new HttpError(401, "Invalid or expired token");

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
