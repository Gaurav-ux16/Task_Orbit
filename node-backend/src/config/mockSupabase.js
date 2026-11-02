import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory Mock Supabase Client for TaskOrbit.
 * Pre-seeded with the exact seed data from database/seed.sql.
 * Allows running the full backend and frontend without external cloud dependencies.
 */

// Initial seed store
// bcrypt hash (cost 10) of the documented DEV-ONLY demo password. Matches database/seed.sql.
export const DEMO_PASSWORD_HASH = '$2b$10$t45DVoHmjSqQpgFbO7whceqp6hc7yYe9/Pzc8i6eFfS0P4KqnS2dq';
const AUTH_DEFAULTS = { password_hash: DEMO_PASSWORD_HASH, failed_logins: 0, locked_until: null, last_login_at: null };

function getInitialStore() {
  const store = buildStore();
  store.profiles = store.profiles.map((p) => ({ ...AUTH_DEFAULTS, created_at: '2026-09-01T00:00:00.000Z', ...p }));
  store.sessions = [];
  return store;
}

function buildStore() {
  return {
    profiles: [
      { id: 'client-001',   display_name: 'Alice Chen (Client)',            role: 'client',          skills: ['Product Management', 'Requirement Scoping'], availability: 'available', email: 'alice@clientcorp.io' },
      { id: 'manager-001',  display_name: 'Bob Martinez (Project Manager)', role: 'project_manager', skills: ['Agile', 'Sprint Planning', 'Risk Mitigation'],    availability: 'available', email: 'bob@taskorbit.io' },
      { id: 'assignee-001', display_name: 'Carol Singh (Developer)',        role: 'assignee',         skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],  availability: 'available', email: 'carol@taskorbit.io' },
      { id: 'assignee-002', display_name: 'Dave Kim (Developer)',           role: 'assignee',         skills: ['Express.js', 'REST APIs', 'PostgreSQL', 'Docker'], availability: 'busy',   email: 'dave@taskorbit.io' },
      { id: 'reviewer-001', display_name: 'Eve Johnson (Reviewer)',         role: 'reviewer',         skills: ['Code Review', 'QA Automation', 'Security Audits'], availability: 'available', email: 'eve@taskorbit.io' },
    ],
    project_requests: [
      {
        id: '11111111-0000-0000-0000-000000000001',
        client_id: 'client-001',
        title: 'E-Commerce Platform Redesign',
        description: 'Complete overhaul of the customer-facing storefront and checkout process.',
        requirements: 'Responsive design, payment gateway integration, inventory sync, and admin dashboard.',
        priority: 'high',
        requested_deadline: '2026-12-31',
        status: 'approved',
        created_at: new Date('2026-09-01T10:00:00Z').toISOString(),
        updated_at: new Date('2026-09-02T10:00:00Z').toISOString(),
      },
      {
        id: '11111111-0000-0000-0000-000000000002',
        client_id: 'client-001',
        title: 'Internal HR Portal',
        description: 'A self-service portal for employee leave management and payroll queries.',
        requirements: 'Leave application, approval workflow, payroll slips, and reporting.',
        priority: 'medium',
        requested_deadline: '2027-03-31',
        status: 'pending',
        created_at: new Date('2026-10-01T11:00:00Z').toISOString(),
        updated_at: new Date('2026-10-01T11:00:00Z').toISOString(),
      },
      {
        id: '11111111-0000-0000-0000-000000000003',
        client_id: 'client-001',
        title: 'Mobile App — Field Service',
        description: 'Native mobile app for field technicians to log and complete work orders.',
        requirements: 'Offline mode, GPS tracking, photo capture, and signature collection.',
        priority: 'critical',
        requested_deadline: '2026-11-30',
        status: 'reviewing',
        created_at: new Date('2026-10-10T14:30:00Z').toISOString(),
        updated_at: new Date('2026-10-12T09:00:00Z').toISOString(),
      },
    ],
    projects: [
      {
        id: '22222222-0000-0000-0000-000000000001',
        request_id: '11111111-0000-0000-0000-000000000001',
        title: 'E-Commerce Platform Redesign',
        description: 'Full-stack redesign including new design system, React frontend, and Express API.',
        client_id: 'client-001',
        manager_id: 'manager-001',
        status: 'active',
        start_date: '2026-10-01',
        due_date: '2026-12-31',
        created_at: new Date('2026-09-05T08:00:00Z').toISOString(),
        updated_at: new Date('2026-09-05T08:00:00Z').toISOString(),
      },
      {
        id: '22222222-0000-0000-0000-000000000002',
        request_id: null,
        title: 'Design System Library',
        description: 'Standalone internal design system and component library.',
        client_id: 'client-001',
        manager_id: 'manager-001',
        status: 'active',
        start_date: '2026-09-15',
        due_date: '2026-11-30',
        created_at: new Date('2026-09-15T09:00:00Z').toISOString(),
        updated_at: new Date('2026-09-15T09:00:00Z').toISOString(),
      },
    ],
    tasks: [
      {
        id: '33333333-0000-0000-0000-000000000001',
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Design new checkout flow',
        description: 'Wireframe and prototype the updated multi-step checkout UI.',
        assignee_id: 'assignee-001',
        priority: 'high',
        status: 'approved',
        start_date: '2026-10-01',
        due_date: '2026-10-15',
        created_at: new Date('2026-09-16T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-14T15:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000002',
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Implement product listing page',
        description: 'Build the filterable, paginated product catalogue with search.',
        assignee_id: 'assignee-001',
        priority: 'high',
        status: 'in_review',
        start_date: '2026-10-10',
        due_date: '2026-10-25',
        created_at: new Date('2026-09-18T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-22T11:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000003',
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Payment gateway integration',
        description: 'Integrate Stripe payment gateway with webhook support.',
        assignee_id: 'assignee-001',
        priority: 'critical',
        status: 'in_progress',
        start_date: '2026-10-20',
        due_date: '2026-11-05',
        created_at: new Date('2026-09-20T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-20T10:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000004',
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Admin dashboard — product management',
        description: 'CRUD interface for product listings, categories and stock levels.',
        assignee_id: 'assignee-002',
        priority: 'medium',
        status: 'submitted',
        start_date: '2026-10-15',
        due_date: '2026-11-01',
        created_at: new Date('2026-09-22T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-24T16:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000005',
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Order history and tracking page',
        description: 'Customer-facing order status and shipment tracking.',
        assignee_id: 'assignee-002',
        priority: 'medium',
        status: 'revision',
        start_date: '2026-10-22',
        due_date: '2026-11-08',
        created_at: new Date('2026-09-25T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-25T14:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000006',
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Write API documentation',
        description: 'Document all REST endpoints using OpenAPI format.',
        assignee_id: 'assignee-002',
        priority: 'low',
        status: 'todo',
        start_date: '2026-11-01',
        due_date: '2026-11-20',
        created_at: new Date('2026-09-28T10:00:00Z').toISOString(),
        updated_at: new Date('2026-09-28T10:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000007',
        project_id: '22222222-0000-0000-0000-000000000002',
        title: 'Token system — colours and spacing',
        description: 'Define the design token system for colours, typography and spacing.',
        assignee_id: 'assignee-001',
        priority: 'high',
        status: 'in_progress',
        start_date: '2026-10-18',
        due_date: '2026-11-03',
        created_at: new Date('2026-09-30T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-18T10:00:00Z').toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000008',
        project_id: '22222222-0000-0000-0000-000000000002',
        title: 'Component library — forms',
        description: 'Build and document all form components with accessibility support.',
        assignee_id: 'assignee-002',
        priority: 'medium',
        status: 'todo',
        start_date: '2026-11-05',
        due_date: '2026-11-25',
        created_at: new Date('2026-10-02T10:00:00Z').toISOString(),
        updated_at: new Date('2026-10-02T10:00:00Z').toISOString(),
      },
    ],
    submissions: [
      {
        id: '44444444-0000-0000-0000-000000000001',
        task_id: '33333333-0000-0000-0000-000000000002',
        version_number: 1,
        submitted_by: 'assignee-001',
        file_path: 'tasks/33333333-0000-0000-0000-000000000002/v1-product-listing.zip',
        file_name: 'product-listing-v1.zip',
        description: 'Initial implementation with basic filtering.',
        created_at: new Date('2026-10-21T14:00:00Z').toISOString(),
      },
      {
        id: '44444444-0000-0000-0000-000000000002',
        task_id: '33333333-0000-0000-0000-000000000004',
        version_number: 1,
        submitted_by: 'assignee-002',
        file_path: 'tasks/33333333-0000-0000-0000-000000000004/v1-admin-dashboard.zip',
        file_name: 'admin-dashboard-v1.zip',
        description: 'First complete version of the admin product management interface.',
        created_at: new Date('2026-10-24T15:30:00Z').toISOString(),
      },
      {
        id: '44444444-0000-0000-0000-000000000003',
        task_id: '33333333-0000-0000-0000-000000000005',
        version_number: 1,
        submitted_by: 'assignee-002',
        file_path: 'tasks/33333333-0000-0000-0000-000000000005/v1-order-history.zip',
        file_name: 'order-history-v1.zip',
        description: 'Initial order history and tracking page.',
        created_at: new Date('2026-10-24T16:00:00Z').toISOString(),
      },
      {
        id: '44444444-0000-0000-0000-000000000004',
        task_id: '33333333-0000-0000-0000-000000000001',
        version_number: 1,
        submitted_by: 'assignee-001',
        file_path: 'tasks/33333333-0000-0000-0000-000000000001/v1-checkout-design.pdf',
        file_name: 'checkout-flow-v1.pdf',
        description: 'Checkout wireframes and final design spec.',
        created_at: new Date('2026-10-12T09:00:00Z').toISOString(),
      },
    ],
    reviews: [
      {
        id: '55555555-0000-0000-0000-000000000001',
        task_id: '33333333-0000-0000-0000-000000000005',
        submission_id: '44444444-0000-0000-0000-000000000003',
        reviewer_id: 'reviewer-001',
        decision: 'revision',
        feedback: 'The tracking status updates in real-time, but the order history table is missing pagination and sort controls. Please add paginated navigation and column sorting before resubmission.',
        created_at: new Date('2026-10-25T14:00:00Z').toISOString(),
      },
      {
        id: '55555555-0000-0000-0000-000000000002',
        task_id: '33333333-0000-0000-0000-000000000001',
        submission_id: '44444444-0000-0000-0000-000000000004',
        reviewer_id: 'reviewer-001',
        decision: 'approved',
        feedback: 'Design is clean and meets all requirements. Approved.',
        created_at: new Date('2026-10-14T15:00:00Z').toISOString(),
      },
    ],
    activity_logs: [
      {
        id: uuidv4(),
        project_id: '22222222-0000-0000-0000-000000000001',
        task_id: null,
        actor_id: 'manager-001',
        action: 'project_created',
        details: { title: 'E-Commerce Platform Redesign' },
        created_at: new Date('2026-09-05T08:00:00Z').toISOString(),
      },
      {
        id: uuidv4(),
        project_id: '22222222-0000-0000-0000-000000000001',
        task_id: '33333333-0000-0000-0000-000000000001',
        actor_id: 'manager-001',
        action: 'task_created',
        details: { title: 'Design new checkout flow', assignee_id: 'assignee-001' },
        created_at: new Date('2026-09-16T10:00:00Z').toISOString(),
      },
      {
        id: uuidv4(),
        project_id: '22222222-0000-0000-0000-000000000001',
        task_id: '33333333-0000-0000-0000-000000000002',
        actor_id: 'assignee-001',
        action: 'submission_created',
        details: { version_number: 1, file_name: 'product-listing-v1.zip' },
        created_at: new Date('2026-10-21T14:00:00Z').toISOString(),
      },
    ],
  };
}

const STORE = getInitialStore();

const UNIQUE_KEYS = {
  profiles: [['email']],
  submissions: [['task_id', 'version_number']],
  sessions: [['token_hash']],
};
const RELATION_KEYS = ['client', 'manager', 'assignee', 'submitter', 'reviewer', 'project', 'tasks', 'submission', 'actor'];
const publicProfile = (p) => (p ? { id: p.id, display_name: p.display_name, role: p.role } : null);

/** Splits a PostgREST select string on top-level commas. */
function splitSelect(columns) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of columns) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const STORAGE_FILES = new Map();

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.sorts = [];
    this.rangeLimit = null;
    this.selectColumns = '*';
    this.isSingle = false;
    this.pendingInsert = null;
    this.pendingUpdate = null;
    this.pendingDelete = false;
    this.isMaybe = false;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column, value) { this.filters.push((row) => row[column] > value); return this; }
  gte(column, value) { this.filters.push((row) => row[column] >= value); return this; }
  lt(column, value) { this.filters.push((row) => row[column] < value); return this; }
  lte(column, value) { this.filters.push((row) => row[column] <= value); return this; }
  is(column, value) { this.filters.push((row) => (row[column] ?? null) === value); return this; }
  ilike(column, value) {
    const needle = String(value).toLowerCase();
    this.filters.push((row) => String(row[column] ?? '').toLowerCase() === needle);
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    this.isMaybe = true;
    return this;
  }

  in(column, values) {
    this.filters.push((row) => Array.isArray(values) && values.includes(row[column]));
    return this;
  }

  not(column, operator, value) {
    if (operator === 'eq') {
      this.filters.push((row) => row[column] !== value);
    }
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.sorts.push({ column, ascending });
    return this;
  }

  range(from, to) {
    this.rangeLimit = { from, to };
    return this;
  }

  limit(count) {
    this.rangeLimit = { from: 0, to: count - 1 };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data) {
    this.pendingInsert = Array.isArray(data) ? data : [data];
    return this;
  }

  update(patch) {
    this.pendingUpdate = patch;
    return this;
  }

  delete() {
    this.pendingDelete = true;
    return this;
  }

  _violatesUnique(record) {
    for (const cols of UNIQUE_KEYS[this.table] || []) {
      const dupe = (STORE[this.table] || []).some((row) =>
        cols.every((c) => row[c] !== undefined && row[c] !== null && String(row[c]).toLowerCase() === String(record[c]).toLowerCase())
      );
      if (dupe) return cols;
    }
    return null;
  }

  _execute() {
    let rows = STORE[this.table] || [];

    // Handle Insert
    if (this.pendingInsert) {
      const inserted = [];
      for (const item of this.pendingInsert) {
        const record = {
          id: item.id || uuidv4(),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          ...item,
        };
        const dupe = this._violatesUnique(record);
        if (dupe) {
          return {
            data: null,
            error: { message: `duplicate key value violates unique constraint on (${dupe.join(', ')})`, code: '23505' },
          };
        }
        rows.push(record);
        inserted.push(record);
      }
      const projected = inserted.map((r) => this._project(r));
      return { data: this.isSingle ? projected[0] : projected, error: null };
    }

    // Filter
    const filtered = rows.filter((row) => this.filters.every((fn) => fn(row)));

    // Handle Update
    if (this.pendingUpdate) {
      filtered.forEach((row) => {
        Object.assign(row, this.pendingUpdate, { updated_at: new Date().toISOString() });
      });
      const projected = filtered.map((r) => this._project(r));
      if (this.isSingle) {
        return {
          data: projected[0] || null,
          error: projected[0] || this.isMaybe ? null : { message: 'Row not found', code: 'PGRST116' },
        };
      }
      return { data: projected, error: null };
    }

    // Handle Delete
    if (this.pendingDelete) {
      STORE[this.table] = rows.filter((row) => !filtered.includes(row));
      return { data: filtered, error: null };
    }

    // Sort
    for (const { column, ascending } of this.sorts) {
      filtered.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return ascending ? 1 : -1;
        if (valB === null || valB === undefined) return ascending ? -1 : 1;
        if (ascending) return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
    }

    const totalCount = filtered.length;

    // Range / Limit
    let page = filtered;
    if (this.rangeLimit) {
      const { from, to } = this.rangeLimit;
      page = filtered.slice(from, to + 1);
    }

    const result = page.map((row) => this._project(row));

    if (this.isSingle) {
      const singleRow = result[0] || null;
      return {
        data: singleRow,
        error: singleRow || this.isMaybe ? null : { message: 'Row not found', code: 'PGRST116' },
      };
    }

    return { data: result, count: totalCount, error: null };
  }

  /** Applies the PostgREST-style select list (own columns + embedded relations). */
  _project(row) {
    const tokens = splitSelect(this.selectColumns || '*');
    const out = {};
    for (const token of tokens) {
      if (token === '*') {
        Object.assign(out, row);
        continue;
      }
      const paren = token.indexOf('(');
      if (paren === -1) {
        if (token in row) out[token] = row[token];
        continue;
      }
      const head = token.slice(0, paren);
      const alias = head.includes(':') ? head.split(':')[0].trim() : head.trim();
      const inner = token.slice(paren + 1, token.lastIndexOf(')'));
      const cols = splitSelect(inner).filter((c) => !c.includes('('));
      const related = this._resolveRelation(alias, row);
      const pick = (obj) => {
        if (!obj) return obj;
        if (cols.includes('*') || cols.length === 0) return { ...obj };
        return Object.fromEntries(cols.filter((c) => c in obj).map((c) => [c, obj[c]]));
      };
      out[alias] = Array.isArray(related) ? related.map(pick) : pick(related);
    }
    return out;
  }

  _resolveRelation(alias, row) {
    const profile = (id) => (id ? publicProfile(STORE.profiles.find((p) => p.id === id)) : null);
    switch (alias) {
      case 'client': return profile(row.client_id);
      case 'manager': return profile(row.manager_id);
      case 'assignee': return profile(row.assignee_id);
      case 'submitter': return profile(row.submitted_by);
      case 'reviewer': return profile(row.reviewer_id);
      case 'actor': return profile(row.actor_id);
      case 'project': return STORE.projects.find((p) => p.id === row.project_id) || null;
      case 'tasks': return STORE.tasks.filter((t) => t.project_id === row.id);
      case 'submission': return STORE.submissions.find((s) => s.id === row.submission_id) || null;
      default: return null;
    }
  }

  // Promise interface
  then(onFulfilled, onRejected) {
    const res = this._execute();
    return Promise.resolve(res).then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
}

export const mockSupabase = {
  from(table) {
    return new QueryBuilder(table);
  },
  storage: {
    from(bucket) {
      return {
        async upload(storagePath, fileBuffer, options = {}) {
          STORAGE_FILES.set(storagePath, {
            buffer: fileBuffer,
            contentType: options.contentType || 'application/octet-stream',
          });
          return { data: { path: storagePath }, error: null };
        },
        async createSignedUrl(storagePath, expiresInSeconds = 3600) {
          const file = STORAGE_FILES.get(storagePath);
          let signedUrl = '';
          if (file && file.buffer) {
            const b64 = Buffer.from(file.buffer).toString('base64');
            signedUrl = `data:${file.contentType};base64,${b64}`;
          } else {
            signedUrl = `https://taskorbit.local/download/${encodeURIComponent(storagePath)}`;
          }
          return { data: { signedUrl }, error: null };
        },
        async remove(paths) {
          const list = Array.isArray(paths) ? paths : [paths];
          for (const p of list) {
            STORAGE_FILES.delete(p);
          }
          return { data: list, error: null };
        },
      };
    },
  },
};

/** Test helper: restore the pristine seed data. */
export function resetMockStore() {
  const fresh = getInitialStore();
  for (const key of Object.keys(STORE)) delete STORE[key];
  Object.assign(STORE, fresh);
  STORAGE_FILES.clear();
}
