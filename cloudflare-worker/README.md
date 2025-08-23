# Real Estate CRM - Cloudflare Worker DB Proxy

Secure database proxy for the Real Estate CRM system using Cloudflare D1.

## Features

- **HMAC Authentication**: All requests must be signed with shared secret
- **Prepared Statements**: SQL injection prevention
- **Rate Limiting**: Built-in Cloudflare protection
- **Validation**: Zod schemas for all inputs
- **Audit Logging**: Request logging and monitoring

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

```bash
# Create D1 database
wrangler d1 create real_estate_db

# Update wrangler.toml with the database_id from above command
```

### 3. Apply Migrations

```bash
# Apply schema
wrangler d1 migrations apply real_estate_db --local

# Seed data
wrangler d1 execute real_estate_db --local --file ../db/seed.sql
```

### 4. Set Secrets

```bash
# Set HMAC secret
wrangler secret put HMAC_SECRET
# Enter your HMAC secret when prompted
```

### 5. Deploy

```bash
# Deploy to Cloudflare
wrangler deploy

# Test deployment
curl https://your-worker.your-subdomain.workers.dev/health
```

## Development

```bash
# Run locally
npm run dev

# Tail logs
npm run tail
```

## Security

### HMAC Signing

All requests to `/sql/*` endpoints must include:
- `X-Ts`: Unix timestamp
- `X-Sign`: HMAC-SHA256 signature

Signature calculation:
```
signature = HMAC-SHA256(secret, timestamp + body)
```

### Request Validation

- Timestamp must be within 2 minutes of current time
- Request body must be valid JSON
- All SQL parameters are bound to prepared statements

### Allowed Operations

The worker only exposes whitelisted SQL operations:
- User authentication and management
- Entity CRUD with proper filtering
- Pending actions workflow
- Document metadata storage

Raw SQL execution is not permitted.

## API Endpoints

### Health Check
- `GET /health` - Worker health status

### Users
- `POST /sql/users.get_by_username` - Get user by username
- `POST /sql/users.get_by_id` - Get user by ID
- `POST /sql/users.list` - List users with filters
- `POST /sql/users.create` - Create user
- `POST /sql/users.update` - Update user
- `POST /sql/users.delete` - Delete user

### Leads
- `POST /sql/leads.list` - List leads with filters
- `POST /sql/leads.get_by_id` - Get lead by ID
- `POST /sql/leads.create` - Create lead
- `POST /sql/leads.update` - Update lead
- `POST /sql/leads.delete` - Delete lead

### Other Entities
Similar patterns for developers, projects, inventory, land, contacts.

### Pending Actions
- `POST /sql/pending_actions.list` - List pending actions
- `POST /sql/pending_actions.create` - Create pending action
- `POST /sql/pending_actions.update` - Update pending action

### Documents
- `POST /sql/documents.list` - List documents
- `POST /sql/documents.create` - Create document record
- `POST /sql/documents.delete` - Delete document record

## Monitoring

The worker provides:
- Request/response logging
- Error tracking
- Performance metrics
- Security event logging

Access logs via:
```bash
wrangler tail
```

## Troubleshooting

### Common Issues

1. **HMAC Signature Mismatch**
   - Verify HMAC_SECRET matches between backend and worker
   - Check timestamp is current (within 2 minutes)
   - Ensure body is exactly as signed (no extra whitespace)

2. **Database Connection Issues**
   - Verify database_id in wrangler.toml
   - Check migrations are applied
   - Ensure D1 database exists in your account

3. **CORS Issues**
   - Update ALLOWED_ORIGINS in wrangler.toml
   - Redeploy worker after changes

### Debug Mode

Set `DEBUG=true` in wrangler.toml for verbose logging:

```toml
[vars]
DEBUG = "true"
```