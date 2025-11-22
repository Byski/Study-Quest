import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import DashboardPage from '@/app/dashboard/[userType]/page';
import AssignmentDetailPage from '@/app/assignments/[id]/page';
import * as supabaseModule from '@/lib/supabase';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(() => '/dashboard/student'),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@/components/Notification', () => {
  return function MockNotification({ message }: { message: string }) {
    return <div data-testid="notification">{message}</div>;
  };
});

describe('Assignment Management - CRUD Operations', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush, back: jest.fn() };
  
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockSingle: jest.Mock;
  let mockGte: jest.Mock;
  let mockLte: jest.Mock;
  let mockSelectChain: any;

  const mockSession = {
    user: {
      id: 'user-123',
      user_metadata: { user_type: 'student' },
    },
  };

  const mockAdminSession = {
    user: {
      id: 'admin-123',
      user_metadata: { user_type: 'admin' },
    },
  };

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test Description',
    difficulty: 'beginner',
    duration: 4,
    category: 'Programming',
    code: 'CS101',
    color: '#0F3460',
    created_at: new Date().toISOString(),
  };

  const mockAssignment = {
    id: 'assignment-1',
    course_id: 'course-1',
    title: 'Test Assignment',
    description: 'Test Assignment Description',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: 'pending',
    points: 100,
    estimated_hours: 5,
    priority: 'medium',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    courses: mockCourse,
  };

  const mockSubmission = {
    id: 'submission-1',
    assignment_id: 'assignment-1',
    user_id: 'user-123',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: 'assignment-1' });
    
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockEq = jest.fn();
    mockOrder = jest.fn();
    mockSingle = jest.fn();
    mockGte = jest.fn();
    mockLte = jest.fn();

    mockSelectChain = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      single: mockSingle,
    };

    (supabaseModule.supabase.from as jest.Mock).mockReturnValue(mockSelectChain);
    mockSelect.mockReturnValue(mockSelectChain);
    mockEq.mockReturnValue(mockSelectChain);
    mockGte.mockReturnValue(mockSelectChain);
    mockLte.mockReturnValue(mockSelectChain);
    mockOrder.mockReturnValue(mockSelectChain);
    mockInsert.mockReturnValue(mockSelectChain);
    mockUpdate.mockReturnValue(mockSelectChain);
    mockDelete.mockReturnValue(mockSelectChain);

    (supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
    });
  });

  describe('Assignment Creation', () => {
    it('should create an assignment with valid data', async () => {
      const newAssignment = {
        ...mockAssignment,
        id: 'assignment-new',
      };

      mockSingle.mockResolvedValue({
        data: newAssignment,
        error: null,
      });

      mockSelect.mockResolvedValue({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Study Planner/i)).toBeInTheDocument();
      });

      // Find and click the create assignment button
      const createButton = screen.getByRole('button', { name: /create assignment/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument();
      });

      // Fill in the form
      const titleInput = screen.getByLabelText(/assignment title/i);
      const courseSelect = screen.getByLabelText(/course/i);
      const dueDateInput = screen.getByLabelText(/due date/i);

      await userEvent.type(titleInput, 'New Assignment');
      await userEvent.selectOptions(courseSelect, 'course-1');
      await userEvent.type(dueDateInput, '2025-12-31');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'New Assignment',
          course_id: 'course-1',
          status: 'pending',
        }),
      ]);
    });

    it('should show error when title is missing', async () => {
      mockSelect.mockResolvedValue({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Study Planner/i)).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create assignment/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('notification')).toHaveTextContent(/assignment title is required/i);
      });
    });

    it('should show error when course is not selected', async () => {
      mockSelect.mockResolvedValue({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Study Planner/i)).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create assignment/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/assignment title/i);
      await userEvent.type(titleInput, 'New Assignment');

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('notification')).toHaveTextContent(/please select a course/i);
      });
    });
  });

  describe('Assignment Status Updates', () => {
    it('should update assignment status from todo to doing', async () => {
      const updatedSubmission = {
        ...mockSubmission,
        status: 'in_progress',
      };

      mockSingle.mockResolvedValue({
        data: updatedSubmission,
        error: null,
      });

      mockEq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      // Mock assignment load
      mockSelect.mockResolvedValueOnce({
        data: { ...mockAssignment, courses: mockCourse },
        error: null,
      });

      // Mock submission load (no existing submission)
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Assignment Details/i)).toBeInTheDocument();
      });

      // Find status select dropdown
      const statusSelect = screen.getByDisplayValue(/todo/i);
      expect(statusSelect).toBeInTheDocument();

      // Change status to "doing"
      await userEvent.selectOptions(statusSelect, 'doing');

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          assignment_id: 'assignment-1',
          user_id: 'user-123',
          status: 'in_progress',
        })
      );
    });

    it('should update existing submission status', async () => {
      const updatedSubmission = {
        ...mockSubmission,
        status: 'completed',
      };

      // Mock assignment load
      mockSelect.mockResolvedValueOnce({
        data: { ...mockAssignment, courses: mockCourse },
        error: null,
      });

      // Mock submission load (existing submission)
      mockEq.mockResolvedValueOnce({
        data: mockSubmission,
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: updatedSubmission,
        error: null,
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Assignment Details/i)).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue(/todo/i);
      await userEvent.selectOptions(statusSelect, 'done');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'completed',
        updated_at: expect.any(String),
      });
    });
  });

  describe('Assignment Listing', () => {
    it('should display assignments for student', async () => {
      const assignments = [
        mockAssignment,
        {
          ...mockAssignment,
          id: 'assignment-2',
          title: 'Another Assignment',
          status: 'in_progress',
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: assignments,
        error: null,
      });

      mockEq.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Another Assignment/i)).toBeInTheDocument();
    });

    it('should display assignments for admin', async () => {
      (supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockAdminSession },
      });

      const assignments = [mockAssignment];

      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: assignments,
        error: null,
      });

      render(<DashboardPage params={{ userType: 'admin' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Assignment Filtering', () => {
    it('should filter assignments by course', async () => {
      const assignments = [
        mockAssignment,
        {
          ...mockAssignment,
          id: 'assignment-2',
          course_id: 'course-2',
          title: 'Other Course Assignment',
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockCourse, { ...mockCourse, id: 'course-2', title: 'Other Course' }],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: assignments,
        error: null,
      });

      mockEq.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument();
      });

      // Find course filter dropdown
      const courseFilter = screen.getByLabelText(/filter by course/i);
      expect(courseFilter).toBeInTheDocument();

      // Select a course filter
      await userEvent.selectOptions(courseFilter, 'course-1');

      // Verify filter is applied (this would trigger a reload in real app)
      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('course_id', 'course-1');
      });
    });

    it('should filter assignments by status', async () => {
      const assignments = [
        mockAssignment,
        {
          ...mockAssignment,
          id: 'assignment-2',
          status: 'in_progress',
          title: 'In Progress Assignment',
        },
      ];

      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: assignments,
        error: null,
      });

      mockEq.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument();
      });

      // Find status filter dropdown
      const statusFilter = screen.getByLabelText(/filter by status/i);
      expect(statusFilter).toBeInTheDocument();

      // Select a status filter
      await userEvent.selectOptions(statusFilter, 'doing');

      // Verify filter is applied
      await waitFor(() => {
        expect(mockEq).toHaveBeenCalled();
      });
    });
  });

  describe('Assignment Detail Page', () => {
    it('should display assignment details', async () => {
      mockSelect.mockResolvedValueOnce({
        data: { ...mockAssignment, courses: mockCourse },
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Test Assignment Description/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Course/i)).toBeInTheDocument();
    });

    it('should show error when assignment not found', async () => {
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Assignment not found', code: 'PGRST116' },
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Assignment Not Found/i)).toBeInTheDocument();
      });
    });

    it('should display due date information', async () => {
      const assignmentWithDueDate = {
        ...mockAssignment,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSelect.mockResolvedValueOnce({
        data: { ...assignmentWithDueDate, courses: mockCourse },
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Due Date/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Due in/i)).toBeInTheDocument();
    });

    it('should display priority information', async () => {
      const assignmentWithPriority = {
        ...mockAssignment,
        priority: 'high',
      };

      mockSelect.mockResolvedValueOnce({
        data: { ...assignmentWithPriority, courses: mockCourse },
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Priority/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });
  });

  describe('Assignment Error Handling', () => {
    it('should handle assignment creation errors', async () => {
      mockSelect.mockResolvedValue({
        data: [mockCourse],
        error: null,
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '23505' },
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Study Planner/i)).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create assignment/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/assignment title/i);
      const courseSelect = screen.getByLabelText(/course/i);
      const dueDateInput = screen.getByLabelText(/due date/i);

      await userEvent.type(titleInput, 'New Assignment');
      await userEvent.selectOptions(courseSelect, 'course-1');
      await userEvent.type(dueDateInput, '2025-12-31');

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('notification')).toHaveTextContent(/failed to create assignment/i);
      });
    });

    it('should handle status update errors', async () => {
      mockSelect.mockResolvedValueOnce({
        data: { ...mockAssignment, courses: mockCourse },
        error: null,
      });

      mockEq.mockResolvedValueOnce({
        data: mockSubmission,
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: '23505' },
      });

      render(<AssignmentDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Assignment Details/i)).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue(/todo/i);
      await userEvent.selectOptions(statusSelect, 'doing');

      await waitFor(() => {
        expect(screen.getByTestId('notification')).toHaveTextContent(/failed to update status/i);
      });
    });
  });
});

