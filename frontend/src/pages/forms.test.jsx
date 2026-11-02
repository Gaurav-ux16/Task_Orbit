import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, signedInState } from '../test/utils';

vi.mock('../services/taskOrbitApi', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), changePassword: vi.fn() },
  usersApi: { create: vi.fn() },
  projectRequestsApi: { create: vi.fn(), list: vi.fn().mockResolvedValue({ data: { data: [] } }), update: vi.fn() },
  projectsApi: { create: vi.fn(), list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
  profilesApi: {
    list: vi.fn().mockResolvedValue({
      data: { data: [{ id: 'assignee-001', display_name: 'Carol Singh', role: 'assignee' }, { id: 'client-001', display_name: 'Alice', role: 'client' }] },
    }),
  },
  tasksApi: { create: vi.fn(), update: vi.fn(), previewConflicts: vi.fn(), updateStatus: vi.fn(), list: vi.fn() },
  submissionsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }), getDownloadUrl: vi.fn() },
  reviewsApi: { create: vi.fn() },
  workersApi: { list: vi.fn() },
}));

import { projectRequestsApi, tasksApi, usersApi, reviewsApi } from '../services/taskOrbitApi';
import { NewRequestModal } from './client/NewRequestModal';
import { NewTaskModal } from './manager/NewTaskModal';
import { AddMemberModal } from './manager/AddMemberModal';
import { SubmissionForm } from './assignee/SubmissionForm';
import { ReviewModal } from './reviewer/ReviewModal';

beforeEach(() => vi.clearAllMocks());

const ATTACKS = [
  "'; DROP TABLE profiles; --",
  "' OR 1=1 --",
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
];

// user-event treats { and [ as special keys; paste is the reliable way to enter arbitrary text.
const enter = async (el, text) => {
  await userEvent.click(el);
  await userEvent.paste(text);
};

describe('NewRequestModal (client form) — validation before saving', () => {
  const setup = () => renderWithProviders(<NewRequestModal onClose={() => {}} />, { state: signedInState('client') });

  test('required fields are enforced and nothing is sent', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/deadline is required/i)).toBeInTheDocument();
    expect(projectRequestsApi.create).not.toHaveBeenCalled();
  });

  test.each(ATTACKS)('title payload %s is blocked before saving', async (payload) => {
    setup();
    await enter(screen.getByLabelText(/project title/i), payload);
    await enter(screen.getByLabelText(/project description/i), 'A perfectly valid description of the project.');
    fireEvent.change(screen.getByLabelText(/target deadline/i), { target: { value: '2027-06-01' } });
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(projectRequestsApi.create).not.toHaveBeenCalled();
  });

  test.each(ATTACKS)('description payload %s is blocked before saving', async (payload) => {
    setup();
    await enter(screen.getByLabelText(/project title/i), 'Valid title');
    await enter(screen.getByLabelText(/project description/i), payload);
    fireEvent.change(screen.getByLabelText(/target deadline/i), { target: { value: '2027-06-01' } });
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByText(/disallowed content|at least 10/i)).toBeInTheDocument();
    expect(projectRequestsApi.create).not.toHaveBeenCalled();
  });

  test('valid input is sent WITHOUT any client-supplied identity', async () => {
    projectRequestsApi.create.mockResolvedValue({ data: { data: { id: 'r1' } } });
    setup();
    await enter(screen.getByLabelText(/project title/i), 'Customer portal');
    await enter(screen.getByLabelText(/project description/i), 'Portal for customers to track their orders.');
    fireEvent.change(screen.getByLabelText(/target deadline/i), { target: { value: '2027-06-01' } });
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));
    await vi.waitFor(() => expect(projectRequestsApi.create).toHaveBeenCalledTimes(1));
    const payload = projectRequestsApi.create.mock.calls[0][0];
    expect(payload).toMatchObject({ title: 'Customer portal', priority: 'medium', requested_deadline: '2027-06-01' });
    expect(payload).not.toHaveProperty('client_id');
  });
});

describe('NewTaskModal (manager form)', () => {
  const setup = (props = {}) =>
    renderWithProviders(<NewTaskModal projectId="22222222-0000-0000-0000-000000000001" onClose={() => {}} {...props} />, {
      state: signedInState('project_manager'),
    });

  test('end date before start date is rejected', async () => {
    setup();
    await enter(screen.getByLabelText(/^title/i), 'Write docs');
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2027-05-10' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2027-05-01' } });
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByText(/must not be after due date/i)).toBeInTheDocument();
    expect(tasksApi.create).not.toHaveBeenCalled();
  });

  test.each(ATTACKS)('description payload %s is blocked', async (payload) => {
    setup();
    await enter(screen.getByLabelText(/^title/i), 'Write docs');
    await enter(screen.getByLabelText(/description/i), payload);
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2027-05-01' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2027-05-02' } });
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByText(/disallowed content/i)).toBeInTheDocument();
    expect(tasksApi.create).not.toHaveBeenCalled();
  });

  test('a server-detected conflict is surfaced and requires explicit confirmation', async () => {
    tasksApi.create
      .mockRejectedValueOnce({
        response: { status: 409, data: { hasConflicts: true, conflicts: [{ id: 'x', title: 'Existing task', start_date: '2027-05-01', due_date: '2027-05-09', status: 'todo' }] } },
      })
      .mockResolvedValueOnce({ data: { data: { id: 'new' } } });
    const onClose = vi.fn();
    setup({ onClose });

    await enter(screen.getByLabelText(/^title/i), 'Write docs');
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2027-05-02' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2027-05-04' } });
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    expect(await screen.findByTestId('conflict-banner')).toBeInTheDocument();
    expect(screen.getByText('Existing task')).toBeInTheDocument();

    // cannot proceed without acknowledging
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByText(/acknowledge the scheduling conflict/i)).toBeInTheDocument();
    expect(tasksApi.create).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByLabelText(/i acknowledge the conflict/i));
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(tasksApi.create.mock.calls[1][0]).toMatchObject({ override_conflicts: true });
  });

  test('"assign from worker directory" creates a NEW task (no id => POST, not PATCH)', async () => {
    tasksApi.create.mockResolvedValue({ data: { data: { id: 'new' } } });
    renderWithProviders(
      <NewTaskModal projects={[{ id: '22222222-0000-0000-0000-000000000001', title: 'Shop' }]} defaults={{ assignee_id: 'assignee-001' }} onClose={() => {}} />,
      { state: signedInState('project_manager') }
    );
    await userEvent.selectOptions(screen.getByLabelText(/^project/i), '22222222-0000-0000-0000-000000000001');
    await enter(screen.getByLabelText(/^title/i), 'Assigned from directory');
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2027-05-01' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2027-05-02' } });
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    await vi.waitFor(() => expect(tasksApi.create).toHaveBeenCalled());
    expect(tasksApi.update).not.toHaveBeenCalled();
    expect(tasksApi.create.mock.calls[0][0]).toMatchObject({ assignee_id: 'assignee-001', project_id: '22222222-0000-0000-0000-000000000001' });
  });
});

describe('AddMemberModal (account provisioning)', () => {
  test('rejects weak passwords and malicious names; accepts a valid account', async () => {
    usersApi.create.mockResolvedValue({ data: { data: { id: 'u1' } } });
    const onCreated = vi.fn();
    renderWithProviders(<AddMemberModal onClose={() => {}} onCreated={onCreated} />, { state: signedInState('project_manager') });

    await enter(screen.getByLabelText(/full name/i), "Robert'); DROP TABLE Students;--");
    await enter(screen.getByLabelText(/e-mail/i), 'rob@example.com');
    await enter(screen.getByLabelText(/temporary password/i), 'weak');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/name must be/i)).toBeInTheDocument();
    expect(screen.getByText(/password needs/i)).toBeInTheDocument();
    expect(usersApi.create).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText(/full name/i));
    await enter(screen.getByLabelText(/full name/i), 'Rob Stone');
    await userEvent.clear(screen.getByLabelText(/temporary password/i));
    await enter(screen.getByLabelText(/temporary password/i), 'Str0ng!Passphrase');
    await enter(screen.getByLabelText(/skills/i), 'React, Node.js');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(usersApi.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'assignee', skills: ['React', 'Node.js'] }));
  });
});

describe('SubmissionForm (assignee upload)', () => {
  const makeFile = (name, size = 10) => new File([new Uint8Array(size)], name);

  test('blocks executables and double extensions client-side', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<SubmissionForm taskId="t1" onSubmitDeliverable={onSubmit} />, { state: signedInState('assignee') });
    const input = screen.getByLabelText(/deliverable attachment/i);

    await userEvent.upload(input, makeFile('setup.exe'), { applyAccept: false });
    expect(await screen.findByText(/invalid file format/i)).toBeInTheDocument();

    await userEvent.upload(screen.getByLabelText(/deliverable attachment/i), makeFile('shell.php.zip'), { applyAccept: false });
    expect(await screen.findByText(/executable or script-like/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('revision submissions require a note; malicious notes are blocked', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<SubmissionForm taskId="t1" isRevision onSubmitDeliverable={onSubmit} />, { state: signedInState('assignee') });
    await userEvent.upload(screen.getByLabelText(/deliverable attachment/i), makeFile('work.zip'));
    await userEvent.click(screen.getByRole('button', { name: /resubmit work/i }));
    expect(await screen.findByText(/submission note is required/i)).toBeInTheDocument();

    await enter(screen.getByLabelText(/submission notes/i), '<script>steal()</script>');
    await userEvent.click(screen.getByRole('button', { name: /resubmit work/i }));
    expect(await screen.findByText(/disallowed content/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('valid file + note is submitted as multipart form data', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderWithProviders(<SubmissionForm taskId="t1" onSubmitDeliverable={onSubmit} />, { state: signedInState('assignee') });
    await userEvent.upload(screen.getByLabelText(/deliverable attachment/i), makeFile('work.zip'));
    await enter(screen.getByLabelText(/submission notes/i), 'First version of the checkout flow');
    await userEvent.click(screen.getByRole('button', { name: /submit for review/i }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const form = onSubmit.mock.calls[0][0];
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('description')).toBe('First version of the checkout flow');
    expect(form.get('file').name).toBe('work.zip');
  });
});

describe('ReviewModal (reviewer form)', () => {
  const task = { id: 't1', title: 'Checkout flow', status: 'in_review', priority: 'high', project: { title: 'Shop' } };
  const latest = { id: 's1', version_number: 2, file_name: 'v2.zip', description: 'notes' };

  test('"Begin review" uses the tasks API (regression: missing import)', async () => {
    tasksApi.updateStatus.mockResolvedValue({});
    renderWithProviders(<ReviewModal task={{ ...task, status: 'submitted', latest_submission: latest }} onClose={() => {}} />, {
      state: signedInState('reviewer'),
    });
    await userEvent.click(screen.getByRole('button', { name: /begin review/i }));
    await vi.waitFor(() => expect(tasksApi.updateStatus).toHaveBeenCalledWith('t1', 'in_review'));
  });

  test('revision needs feedback; hostile feedback is blocked; valid decision is posted', async () => {
    reviewsApi.create.mockResolvedValue({ data: { data: {} } });
    const onClose = vi.fn();
    renderWithProviders(<ReviewModal task={{ ...task, latest_submission: latest }} onClose={onClose} />, { state: signedInState('reviewer') });

    await userEvent.click(screen.getByRole('button', { name: /request revision/i, hidden: false }));
    await userEvent.click(screen.getAllByRole('button', { name: /request revision/i }).at(-1));
    expect(await screen.findByText(/feedback is required/i)).toBeInTheDocument();

    await enter(screen.getByLabelText(/feedback/i), "'; DROP TABLE reviews; --");
    await userEvent.click(screen.getAllByRole('button', { name: /request revision/i }).at(-1));
    expect(await screen.findByText(/disallowed content/i)).toBeInTheDocument();
    expect(reviewsApi.create).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText(/feedback/i));
    await enter(screen.getByLabelText(/feedback/i), 'Please add pagination to the order table.');
    await userEvent.click(screen.getAllByRole('button', { name: /request revision/i }).at(-1));
    await vi.waitFor(() => expect(reviewsApi.create).toHaveBeenCalledWith('s1', expect.objectContaining({ decision: 'revision', task_id: 't1' })));
  });

  test('stale-version 409 is shown as a version conflict', async () => {
    reviewsApi.create.mockRejectedValue({ response: { status: 409, data: { error: 'Stale review rejected: outdated submission version 1.' } } });
    renderWithProviders(<ReviewModal task={{ ...task, latest_submission: latest }} onClose={() => {}} />, { state: signedInState('reviewer') });
    await userEvent.click(screen.getByRole('button', { name: /approve submission/i }));
    expect(await screen.findByText(/version conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/outdated submission version/i)).toBeInTheDocument();
  });
});
