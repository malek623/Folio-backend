# Folio - Backend API

**Student name:** MALEK Fatma zohra
**Module:** WAMD - TD/TP 3 (ENSTA, SS/IA, 2026)

## Application description

REST API for **Folio**, the online book store built in TD/TP 2 (React + Redux). The API stores the book catalog and the users in MongoDB, lets clients read the catalog, and lets authenticated users create, update and delete products. Users register and log in with email/password (JWT), and protected routes also accept an OAuth 2.0 / OpenID Connect access token. Rate limiting protects the API and the login endpoint.

## Technologies used

Node.js, Express.js, MongoDB + Mongoose, bcryptjs (password hashing), jsonwebtoken (JWT), jose (OAuth2/OIDC token verification), express-rate-limit, cors, dotenv, Postman.

## Project structure

```
src/
  app.js                    Express app (CORS, JSON, routes, rate limiter, errors)
  server.js                 Entry point (loads .env, connects to MongoDB, starts server)
  config/db.js              Mongoose connection
  models/                   Product.js, User.js
  routes/                   authRoutes.js, productRoutes.js
  controllers/              authController.js, productController.js
  middleware/               auth.js (JWT + OAuth2), rateLimiters.js, errorHandler.js
  utils/                    httpError.js, asyncHandler.js
  seed/                     seed.js + products.json (the 20 books of the React app)
postman/                    Importable Postman collection
```

## Database models

**Product**

| Field | Type | Notes |
|---|---|---|
| name | String | required (book title) |
| description | String | required |
| price | Number | required, >= 0 |
| category | String | required |
| imageUrl | String | e.g. `/letranger.webp` (served by the React app's `public/` folder) |
| stock | Number | required, integer >= 0 |
| author, oldPrice, rating, year, pages | optional | extra fields used by the React app |

**User**

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| passwordHash | String | bcrypt hash, never returned by the API |

## API endpoints

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | /api/auth/register | Register a new user | Public |
| POST | /api/auth/login | Log in, returns a JWT | Public (5 req / 15 min / IP) |
| GET | /api/products | List all products (optional `?category=Fiction`) | Public |
| GET | /api/products/:id | Get one product | Public |
| POST | /api/products | Create a product | Token required |
| PUT | /api/products/:id | Update a product | Token required |
| DELETE | /api/products/:id | Delete a product | Token required |

All `/api` routes: 100 requests / 15 min / IP.

**Status codes:** 200 OK, 201 Created, 400 invalid input / invalid id, 401 missing or invalid token / bad credentials, 404 not found, 409 duplicate email, 429 too many requests, 500 server error.

**Error format (always the same):**
```json
{ "error": { "status": 400, "message": "Validation failed", "details": ["price must be >= 0"] } }
```

## JWT authentication

1. `POST /api/auth/login` checks the email and compares the password with the stored bcrypt hash.
2. On success the server signs a JWT (HS256) containing the user id (`sub`) and email, valid for `JWT_EXPIRES_IN` (default 1 h), using the secret `JWT_SECRET` from the environment.
3. The client sends the token with every protected request: `Authorization: Bearer <JWT_TOKEN>`.
4. The `requireAuth` middleware (`src/middleware/auth.js`) extracts the token, verifies signature and expiry, and either calls `next()` or answers **401**.

### OAuth 2.0 / OpenID Connect

`requireAuth` also accepts an access token issued by an external provider (Google by default), so the same protected routes can be tested with Postman's OAuth 2.0 authorization type:
- if the token is a signed JWT (OIDC ID token), it is verified against the provider's public keys (JWKS), checking issuer, audience (`OAUTH_CLIENT_ID`) and expiry;
- if it is an opaque access token, it is validated by calling the provider's userinfo endpoint.

**Postman setup with Google:**
1. Google Cloud Console -> APIs & Services -> OAuth consent screen (External, add yourself as a test user) -> Credentials -> *Create OAuth client ID* -> type **Web application**. Add the redirect URI `https://oauth.pstmn.io/v1/callback`. Copy the client ID and secret.
2. Put the client ID in `.env` as `OAUTH_CLIENT_ID`.
3. In Postman, open the request *Create product with OAuth2 access token* -> **Authorization** tab -> type **OAuth 2.0** and fill in:
   - Grant type: **Authorization Code (With PKCE)**, Code challenge method: SHA-256
   - Callback URL: `https://oauth.pstmn.io/v1/callback` (tick *Authorize using browser*)
   - Auth URL: `https://accounts.google.com/o/oauth2/v2/auth`
   - Access Token URL: `https://oauth2.googleapis.com/token`
   - Client ID / Client Secret: from step 1
   - Scope: `openid email profile`
4. Click **Get New Access Token**, sign in with Google, then **Use Token** and send the request. Without a token (or with a bad one) the API answers 401.

## Installation and running

```bash
npm install
cp .env.example .env      # then edit .env (see below)
npm run seed              # optional: inserts the 20 sample books
npm run dev               # or: npm start
```
The API listens on `http://localhost:3000`.

## MongoDB and environment variables

**MongoDB Atlas:** create a free cluster -> Database Access: create a user -> Network Access: allow your IP -> Connect -> Drivers -> copy the connection string, add a database name (e.g. `...mongodb.net/folio?retryWrites=true&w=majority`).
**Local MongoDB:** use `mongodb://127.0.0.1:27017/folio`.

| Variable | Description |
|---|---|
| PORT | Server port (3000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Long random secret used to sign JWTs |
| JWT_EXPIRES_IN | Token lifetime (default `1h`) |
| CLIENT_ORIGIN | React dev origin allowed by CORS (`http://localhost:5173`) |


Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

The `.env` file is in `.gitignore` and must never be committed; `.env.example` contains placeholders only.

## Testing

Import `postman/Folio.postman_collection.json` into Postman and run the requests in order (the login request stores the JWT in the `token` variable, the product requests store `productId`). The folders cover authentication, product CRUD, security and error cases, OAuth2 and rate limiting.

**Rate limiting:** send *Login* 6 times within 15 minutes: the 6th answer is **429 Too Many Requests**. Restart the server to reset the counters. For the general limit (100 req / 15 min), use Postman's *Collection Runner* on `GET /api/products` with 101 iterations.
