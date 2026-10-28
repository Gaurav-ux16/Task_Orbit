-- ============================================================
-- TaskOrbit Seed Data
-- Run AFTER schema.sql
-- Safe to re-run: inserts only if IDs don't exist
-- ============================================================

-- ── Profiles (dev fixtures) ──────────────────────────────────────────────────
INSERT INTO profiles (id, display_name, role, skills, availability, email) VALUES
  ('client-001',   'Alice Chen (Client)',            'client',          ARRAY['Product Management', 'Requirement Scoping'], 'available', 'alice@clientcorp.io'),
  ('manager-001',  'Bob Martinez (Project Manager)', 'project_manager', ARRAY['Agile', 'Sprint Planning', 'Risk Mitigation'],    'available', 'bob@taskorbit.io'),
  ('assignee-001', 'Carol Singh (Developer)',        'assignee',         ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL'],  'available', 'carol@taskorbit.io'),
  ('assignee-002', 'Dave Kim (Developer)',           'assignee',         ARRAY['Express.js', 'REST APIs', 'PostgreSQL', 'Docker'], 'busy',   'dave@taskorbit.io'),
  ('reviewer-001', 'Eve Johnson (Reviewer)',         'reviewer',         ARRAY['Code Review', 'QA Automation', 'Security Audits'], 'available', 'eve@taskorbit.io')
ON CONFLICT (id) DO UPDATE SET
  skills = EXCLUDED.skills,
  availability = EXCLUDED.availability,
  email = EXCLUDED.email;

-- ── Project Requests ─────────────────────────────────────────────────────────
INSERT INTO project_requests (id, client_id, title, description, requirements, priority, requested_deadline, status) VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'client-001',
    'E-Commerce Platform Redesign',
    'Complete overhaul of the customer-facing storefront and checkout process.',
    'Responsive design, payment gateway integration, inventory sync, and admin dashboard.',
    'high',
    '2026-12-31',
    'approved'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'client-001',
    'Internal HR Portal',
    'A self-service portal for employee leave management and payroll queries.',
    'Leave application, approval workflow, payroll slips, and reporting.',
    'medium',
    '2027-03-31',
    'pending'
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'client-001',
    'Mobile App — Field Service',
    'Native mobile app for field technicians to log and complete work orders.',
    'Offline mode, GPS tracking, photo capture, and signature collection.',
    'critical',
    '2026-11-30',
    'reviewing'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Projects ─────────────────────────────────────────────────────────────────
INSERT INTO projects (id, request_id, title, description, client_id, manager_id, status, start_date, due_date) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'E-Commerce Platform Redesign',
    'Full-stack redesign including new design system, React frontend, and Express API.',
    'client-001',
    'manager-001',
    'active',
    '2026-10-01',
    '2026-12-31'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    NULL,
    'Design System Library',
    'Standalone internal design system and component library.',
    'client-001',
    'manager-001',
    'active',
    '2026-09-15',
    '2026-11-30'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Tasks (varied statuses, overlapping dates to demo conflicts) ──────────────
INSERT INTO tasks (id, project_id, title, description, assignee_id, priority, status, start_date, due_date) VALUES
  -- Project 1 tasks
  (
    '33333333-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    'Design new checkout flow',
    'Wireframe and prototype the updated multi-step checkout UI.',
    'assignee-001',
    'high',
    'approved',
    '2026-10-01',
    '2026-10-15'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    'Implement product listing page',
    'Build the filterable, paginated product catalogue with search.',
    'assignee-001',
    'high',
    'in_review',
    '2026-10-10',
    '2026-10-25'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000001',
    'Payment gateway integration',
    'Integrate Stripe payment gateway with webhook support.',
    'assignee-001',
    'critical',
    'in_progress',
    '2026-10-20',
    '2026-11-05'
  ),
  (
    '33333333-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000001',
    'Admin dashboard — product management',
    'CRUD interface for product listings, categories and stock levels.',
    'assignee-002',
    'medium',
    'submitted',
    '2026-10-15',
    '2026-11-01'
  ),
  (
    '33333333-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000001',
    'Order history and tracking page',
    'Customer-facing order status and shipment tracking.',
    'assignee-002',
    'medium',
    'revision',
    '2026-10-22',
    '2026-11-08'
  ),
  (
    '33333333-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000001',
    'Write API documentation',
    'Document all REST endpoints using OpenAPI format.',
    'assignee-002',
    'low',
    'todo',
    '2026-11-01',
    '2026-11-20'
  ),
  -- Project 2 tasks (overlapping with task-003 to demonstrate conflict)
  (
    '33333333-0000-0000-0000-000000000007',
    '22222222-0000-0000-0000-000000000002',
    'Token system — colours and spacing',
    'Define the design token system for colours, typography and spacing.',
    'assignee-001',
    'high',
    'in_progress',
    '2026-10-18',
    '2026-11-03'  -- overlaps with task-003 (Oct 20 – Nov 5)
  ),
  (
    '33333333-0000-0000-0000-000000000008',
    '22222222-0000-0000-0000-000000000002',
    'Component library — forms',
    'Build and document all form components with accessibility support.',
    'assignee-002',
    'medium',
    'todo',
    '2026-11-05',
    '2026-11-25'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Submissions ───────────────────────────────────────────────────────────────
INSERT INTO submissions (id, task_id, version_number, submitted_by, file_path, file_name, description) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000002',
    1,
    'assignee-001',
    'tasks/33333333-0000-0000-0000-000000000002/v1-product-listing.zip',
    'product-listing-v1.zip',
    'Initial implementation with basic filtering.'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000004',
    1,
    'assignee-002',
    'tasks/33333333-0000-0000-0000-000000000004/v1-admin-dashboard.zip',
    'admin-dashboard-v1.zip',
    'First complete version of the admin product management interface.'
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000005',
    1,
    'assignee-002',
    'tasks/33333333-0000-0000-0000-000000000005/v1-order-history.zip',
    'order-history-v1.zip',
    'Initial order history and tracking page.'
  ),
  (
    '44444444-0000-0000-0000-000000000004',
    '33333333-0000-0000-0000-000000000001',
    1,
    'assignee-001',
    'tasks/33333333-0000-0000-0000-000000000001/v1-checkout-design.pdf',
    'checkout-flow-v1.pdf',
    'Checkout wireframes and final design spec.'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Reviews ───────────────────────────────────────────────────────────────────
INSERT INTO reviews (id, task_id, submission_id, reviewer_id, decision, feedback) VALUES
  (
    '55555555-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000005',
    '44444444-0000-0000-0000-000000000003',
    'reviewer-001',
    'revision',
    'The tracking status updates in real-time, but the order history table is missing pagination and sort controls. Please add paginated navigation and column sorting before resubmission.'
  ),
  (
    '55555555-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000004',
    'reviewer-001',
    'approved',
    'Design is clean and meets all requirements. Approved.'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Activity Logs ─────────────────────────────────────────────────────────────
INSERT INTO activity_logs (project_id, task_id, actor_id, action, details) VALUES
  ('22222222-0000-0000-0000-000000000001', NULL, 'manager-001', 'project_created', '{"title": "E-Commerce Platform Redesign"}'),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'manager-001', 'task_created', '{"title": "Design new checkout flow", "assignee_id": "assignee-001"}'),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'manager-001', 'task_created', '{"title": "Implement product listing page", "assignee_id": "assignee-001"}'),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'assignee-001', 'submission_created', '{"version_number": 1, "file_name": "product-listing-v1.zip"}'),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'assignee-001', 'status_changed_to_submitted', '{"previous_status": "in_progress"}'),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000005', 'reviewer-001', 'status_changed_to_revision', '{"previous_status": "in_review", "feedback": "Missing pagination and sort controls."}'),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'reviewer-001', 'status_changed_to_approved', '{"previous_status": "in_review"}');
