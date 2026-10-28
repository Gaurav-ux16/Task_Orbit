import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory Mock Supabase Client for TaskOrbit.
 * Pre-seeded with the exact seed data from database/seed.sql.
 * Allows running the full backend and frontend without external cloud dependencies.
 */

// Initial seed store
function getInitialStore() {
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
  }

  select(columns = '*', options = {}) {
    this.selectColumns = columns;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
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

  _execute() {
    let rows = STORE[this.table] || [];

    // Handle Insert
    if (this.pendingInsert) {
      const inserted = this.pendingInsert.map((item) => {
        const record = {
          id: item.id || uuidv4(),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          ...item,
        };
        rows.push(record);
        return record;
      });
      const data = this.isSingle ? inserted[0] : inserted;
      return { data, error: null };
    }

    // Filter
    let filtered = rows.filter((row) => this.filters.every((fn) => fn(row)));

    // Handle Update
    if (this.pendingUpdate) {
      filtered.forEach((row) => {
        Object.assign(row, this.pendingUpdate, { updated_at: new Date().toISOString() });
      });
      const data = this.isSingle ? (filtered[0] || null) : filtered;
      return { data, error: null };
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
    if (this.rangeLimit) {
      const { from, to } = this.rangeLimit;
      filtered = filtered.slice(from, to + 1);
    }

    // Hydrate relations / joins
    const result = filtered.map((row) => this._hydrateRelations(row));

    if (this.isSingle) {
      const singleRow = result[0] || null;
      return {
        data: singleRow,
        error: singleRow ? null : { message: 'Row not found', code: 'PGRST116' },
      };
    }

    return { data: result, count: totalCount, error: null };
  }

  _hydrateRelations(row) {
    const copy = { ...row };

    // Hydrate client:profiles!
    if (copy.client_id) {
      copy.client = STORE.profiles.find((p) => p.id === copy.client_id) || null;
    }
    // Hydrate manager:profiles!
    if (copy.manager_id) {
      copy.manager = STORE.profiles.find((p) => p.id === copy.manager_id) || null;
    }
    // Hydrate assignee:profiles!
    if (copy.assignee_id) {
      copy.assignee = STORE.profiles.find((p) => p.id === copy.assignee_id) || null;
    }
    // Hydrate submitter:profiles!
    if (copy.submitted_by) {
      copy.submitter = STORE.profiles.find((p) => p.id === copy.submitted_by) || null;
    }
    // Hydrate reviewer:profiles!
    if (copy.reviewer_id) {
      copy.reviewer = STORE.profiles.find((p) => p.id === copy.reviewer_id) || null;
    }
    // Hydrate project:projects
    if (copy.project_id) {
      copy.project = STORE.projects.find((p) => p.id === copy.project_id) || null;
    }
    // Hydrate tasks for project
    if (this.table === 'projects') {
      copy.tasks = STORE.tasks.filter((t) => t.project_id === copy.id);
    }
    // Hydrate submission for review
    if (copy.submission_id) {
      copy.submission = STORE.submissions.find((s) => s.id === copy.submission_id) || null;
    }

    return copy;
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
