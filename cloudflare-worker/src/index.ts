import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { createHash, createHmac } from 'crypto';

type Bindings = {
  DB: D1Database;
  HMAC_SECRET: string;
  ALLOWED_ORIGINS: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', timing());
app.use('*', logger());
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.ALLOWED_ORIGINS.split(',');
    return allowed.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Ts', 'X-Sign'],
  credentials: true,
}));

// HMAC verification middleware
app.use('/sql/*', async (c, next) => {
  const timestamp = c.req.header('X-Ts');
  const signature = c.req.header('X-Sign');
  const body = await c.req.text();
  
  if (!timestamp || !signature) {
    return c.json({ ok: false, error: { code: 'MISSING_AUTH', message: 'Missing authentication headers' } }, 401);
  }
  
  // Check timestamp (2 minute window)
  const now = Math.floor(Date.now() / 1000);
  const reqTime = parseInt(timestamp);
  if (Math.abs(now - reqTime) > 120) {
    return c.json({ ok: false, error: { code: 'TIMESTAMP_EXPIRED', message: 'Request timestamp expired' } }, 401);
  }
  
  // Verify HMAC
  const expectedSig = createHmac('sha256', c.env.HMAC_SECRET)
    .update(timestamp + body)
    .digest('hex');
  
  if (signature !== expectedSig) {
    return c.json({ ok: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid request signature' } }, 401);
  }
  
  // Store parsed body for handlers
  try {
    c.set('requestBody', JSON.parse(body));
  } catch {
    return c.json({ ok: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } }, 400);
  }
  
  await next();
});

// Validation schemas
const UserFiltersSchema = z.object({
  q: z.string().optional(),
  role: z.enum(['admin', 'employee']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(50),
  sort: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const LeadFiltersSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  type_of_place: z.string().optional(),
  transaction_type: z.string().optional(),
  site_visit_required: z.enum(['Yes', 'No']).optional(),
  proposal_submitted: z.enum(['Yes', 'No']).optional(),
  shortlisted: z.enum(['Yes', 'No']).optional(),
  deal_closed: z.enum(['Yes', 'No']).optional(),
  owner_id: z.string().optional(),
  assignee_id: z.string().optional(),
  owner_or_assignee_id: z.string().optional(),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(50),
  sort: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Helper functions
function buildWhereClause(filters: any, allowedColumns: string[]): { where: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    
    if (key === 'q' && typeof value === 'string') {
      // Global search across multiple columns
      const searchColumns = allowedColumns.filter(col => 
        ['name', 'username', 'email', 'client_company', 'contact_person', 'city', 'location'].includes(col)
      );
      if (searchColumns.length > 0) {
        const searchConditions = searchColumns.map(col => `${col} LIKE ?`);
        conditions.push(`(${searchConditions.join(' OR ')})`);
        searchColumns.forEach(() => params.push(`%${value}%`));
      }
    } else if (allowedColumns.includes(key)) {
      if (key.endsWith('_id') || ['role', 'status', 'type_of_place', 'transaction_type'].includes(key)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      } else if (typeof value === 'string') {
        conditions.push(`${key} LIKE ?`);
        params.push(`%${value}%`);
      }
    } else if (key === 'owner_or_assignee_id') {
      conditions.push(`(owner_id = ? OR assignee_id = ?)`);
      params.push(value, value);
    }
  });
  
  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

function buildOrderClause(sort: string, sortOrder: string, allowedColumns: string[]): string {
  if (!allowedColumns.includes(sort)) {
    sort = 'created_at';
  }
  return `ORDER BY ${sort} ${sortOrder.toUpperCase()}`;
}

// Users endpoints
app.post('/sql/users.get_by_username', async (c) => {
  const { username } = c.get('requestBody');
  
  const stmt = c.env.DB.prepare('SELECT * FROM users WHERE username = ?');
  const result = await stmt.bind(username).first();
  
  return c.json({ ok: true, user: result });
});

app.post('/sql/users.get_by_id', async (c) => {
  const { id } = c.get('requestBody');
  
  const stmt = c.env.DB.prepare('SELECT * FROM users WHERE id = ?');
  const result = await stmt.bind(id).first();
  
  return c.json({ ok: true, user: result });
});

app.post('/sql/users.list', async (c) => {
  try {
    const filters = UserFiltersSchema.parse(c.get('requestBody'));
    const allowedColumns = ['id', 'username', 'name', 'email', 'mobile_no', 'role', 'status', 'created_at'];
    
    const { where, params } = buildWhereClause(filters, allowedColumns);
    const orderBy = buildOrderClause(filters.sort, filters.sort_order, allowedColumns);
    
    // Count total
    const countStmt = c.env.DB.prepare(`SELECT COUNT(*) as count FROM users ${where}`);
    const countResult = await countStmt.bind(...params).first() as { count: number };
    
    // Get paginated results
    const offset = (filters.page - 1) * filters.page_size;
    const stmt = c.env.DB.prepare(`
      SELECT id, username, name, email, mobile_no, role, status, created_at, updated_at 
      FROM users ${where} ${orderBy} LIMIT ? OFFSET ?
    `);
    const results = await stmt.bind(...params, filters.page_size, offset).all();
    
    return c.json({
      ok: true,
      users: results.results,
      meta: {
        total: countResult.count,
        page: filters.page,
        page_size: filters.page_size,
        total_pages: Math.ceil(countResult.count / filters.page_size)
      }
    });
  } catch (error) {
    return c.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: error.message } }, 400);
  }
});

app.post('/sql/users.create', async (c) => {
  const userData = c.get('requestBody');
  
  const stmt = c.env.DB.prepare(`
    INSERT INTO users (id, username, name, email, mobile_no, role, status, password, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  await stmt.bind(
    userData.id,
    userData.username,
    userData.name,
    userData.email,
    userData.mobile_no,
    userData.role,
    userData.status,
    userData.password
  ).run();
  
  // Return created user (without password)
  const getStmt = c.env.DB.prepare('SELECT id, username, name, email, mobile_no, role, status, created_at FROM users WHERE id = ?');
  const result = await getStmt.bind(userData.id).first();
  
  return c.json({ ok: true, user: result });
});

// Leads endpoints
app.post('/sql/leads.list', async (c) => {
  try {
    const filters = LeadFiltersSchema.parse(c.get('requestBody'));
    const allowedColumns = [
      'id', 'inquiry_no', 'inquiry_date', 'client_company', 'contact_person', 
      'contact_no', 'email', 'type_of_place', 'transaction_type', 'budget', 
      'city', 'location_preference', 'site_visit_required', 'proposal_submitted',
      'shortlisted', 'deal_closed', 'owner_id', 'assignee_id', 'created_at'
    ];
    
    const { where, params } = buildWhereClause(filters, allowedColumns);
    const orderBy = buildOrderClause(filters.sort, filters.sort_order, allowedColumns);
    
    // Count total
    const countStmt = c.env.DB.prepare(`SELECT COUNT(*) as count FROM leads ${where}`);
    const countResult = await countStmt.bind(...params).first() as { count: number };
    
    // Get paginated results with joins
    const offset = (filters.page - 1) * filters.page_size;
    const stmt = c.env.DB.prepare(`
      SELECT 
        l.*,
        u1.name as owner_name,
        u2.name as assignee_name
      FROM leads l
      LEFT JOIN users u1 ON l.owner_id = u1.id
      LEFT JOIN users u2 ON l.assignee_id = u2.id
      ${where} ${orderBy} LIMIT ? OFFSET ?
    `);
    const results = await stmt.bind(...params, filters.page_size, offset).all();
    
    return c.json({
      ok: true,
      leads: results.results,
      meta: {
        total: countResult.count,
        page: filters.page,
        page_size: filters.page_size,
        total_pages: Math.ceil(countResult.count / filters.page_size)
      }
    });
  } catch (error) {
    return c.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: error.message } }, 400);
  }
});

app.post('/sql/leads.get_by_id', async (c) => {
  const { id } = c.get('requestBody');
  
  const stmt = c.env.DB.prepare(`
    SELECT 
      l.*,
      u1.name as owner_name,
      u2.name as assignee_name
    FROM leads l
    LEFT JOIN users u1 ON l.owner_id = u1.id
    LEFT JOIN users u2 ON l.assignee_id = u2.id
    WHERE l.id = ?
  `);
  const result = await stmt.bind(id).first();
  
  return c.json({ ok: true, lead: result });
});

app.post('/sql/leads.create', async (c) => {
  const leadData = c.get('requestBody');
  
  const stmt = c.env.DB.prepare(`
    INSERT INTO leads (
      id, inquiry_no, inquiry_date, client_company, contact_person, contact_no,
      email, designation, department, description, type_of_place, space_requirement,
      transaction_type, budget, city, location_preference, site_visit_required,
      proposal_submitted, shortlisted, deal_closed, owner_id, assignee_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  await stmt.bind(
    leadData.id,
    leadData.inquiry_no,
    leadData.inquiry_date,
    leadData.client_company,
    leadData.contact_person,
    leadData.contact_no,
    leadData.email,
    leadData.designation,
    leadData.department,
    leadData.description,
    leadData.type_of_place,
    leadData.space_requirement,
    leadData.transaction_type,
    leadData.budget,
    leadData.city,
    leadData.location_preference,
    leadData.site_visit_required,
    leadData.proposal_submitted,
    leadData.shortlisted,
    leadData.deal_closed,
    leadData.owner_id,
    leadData.assignee_id
  ).run();
  
  // Return created lead
  const getStmt = c.env.DB.prepare(`
    SELECT 
      l.*,
      u1.name as owner_name,
      u2.name as assignee_name
    FROM leads l
    LEFT JOIN users u1 ON l.owner_id = u1.id
    LEFT JOIN users u2 ON l.assignee_id = u2.id
    WHERE l.id = ?
  `);
  const result = await getStmt.bind(leadData.id).first();
  
  return c.json({ ok: true, lead: result });
});

// Pending Actions endpoints
app.post('/sql/pending_actions.list', async (c) => {
  const filters = c.get('requestBody');
  const allowedColumns = ['id', 'module', 'type', 'requested_by', 'status', 'created_at'];
  
  const { where, params } = buildWhereClause(filters, allowedColumns);
  const orderBy = buildOrderClause(filters.sort || 'created_at', filters.sort_order || 'desc', allowedColumns);
  
  // Count total
  const countStmt = c.env.DB.prepare(`SELECT COUNT(*) as count FROM pending_actions ${where}`);
  const countResult = await countStmt.bind(...params).first() as { count: number };
  
  // Get paginated results
  const offset = ((filters.page || 1) - 1) * (filters.page_size || 50);
  const stmt = c.env.DB.prepare(`
    SELECT 
      pa.*,
      u1.name as requested_by_name,
      u2.name as approved_by_name
    FROM pending_actions pa
    LEFT JOIN users u1 ON pa.requested_by = u1.id
    LEFT JOIN users u2 ON pa.approved_by = u2.id
    ${where} ${orderBy} LIMIT ? OFFSET ?
  `);
  const results = await stmt.bind(...params, filters.page_size || 50, offset).all();
  
  return c.json({
    ok: true,
    pending_actions: results.results,
    meta: {
      total: countResult.count,
      page: filters.page || 1,
      page_size: filters.page_size || 50,
      total_pages: Math.ceil(countResult.count / (filters.page_size || 50))
    }
  });
});

app.post('/sql/pending_actions.create', async (c) => {
  const actionData = c.get('requestBody');
  
  const stmt = c.env.DB.prepare(`
    INSERT INTO pending_actions (
      id, module, type, data, target_id, requested_by, requested_by_name, 
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  await stmt.bind(
    actionData.id,
    actionData.module,
    actionData.type,
    JSON.stringify(actionData.data),
    actionData.target_id,
    actionData.requested_by,
    actionData.requested_by_name,
    actionData.status
  ).run();
  
  return c.json({ ok: true, message: 'Pending action created' });
});

// Documents endpoints
app.post('/sql/documents.list', async (c) => {
  const filters = c.get('requestBody');
  
  let whereClause = '';
  const params: any[] = [];
  
  if (filters.entity) {
    whereClause += 'WHERE entity = ?';
    params.push(filters.entity);
    
    if (filters.entity_id) {
      whereClause += ' AND entity_id = ?';
      params.push(filters.entity_id);
    }
  } else if (filters.entity_id) {
    whereClause += 'WHERE entity_id = ?';
    params.push(filters.entity_id);
  }
  
  if (filters.id) {
    whereClause = whereClause ? `${whereClause} AND id = ?` : 'WHERE id = ?';
    params.push(filters.id);
  }
  
  const stmt = c.env.DB.prepare(`
    SELECT 
      d.*,
      u.name as uploaded_by_name
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const page = filters.page || 1;
  const pageSize = filters.page_size || 50;
  const offset = (page - 1) * pageSize;
  
  const results = await stmt.bind(...params, pageSize, offset).all();
  
  return c.json({
    ok: true,
    documents: results.results,
    meta: { total: results.results.length, page, page_size: pageSize }
  });
});

app.post('/sql/documents.create', async (c) => {
  const docData = c.get('requestBody');
  
  const stmt = c.env.DB.prepare(`
    INSERT INTO documents (
      id, entity, entity_id, label, filename, content_type, file_size,
      r2_key, public_url, uploaded_by, uploaded_by_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  await stmt.bind(
    docData.id,
    docData.entity,
    docData.entity_id,
    docData.label,
    docData.filename,
    docData.content_type,
    docData.file_size,
    docData.r2_key,
    docData.public_url,
    docData.uploaded_by,
    docData.uploaded_by_name
  ).run();
  
  // Return created document
  const getStmt = c.env.DB.prepare('SELECT * FROM documents WHERE id = ?');
  const result = await getStmt.bind(docData.id).first();
  
  return c.json({ ok: true, document: result });
});

// Health check
app.get('/health', (c) => {
  return c.json({ ok: true, status: 'healthy', timestamp: Date.now() });
});

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ 
    ok: false, 
    error: { 
      code: 'INTERNAL_ERROR', 
      message: 'Internal server error' 
    } 
  }, 500);
});

export default app;