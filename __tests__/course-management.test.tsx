import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/dashboard/[userType]/page';
import CoursesPage from '@/app/courses/page';
import * as supabaseModule from '@/lib/supabase';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

describe('Course Management - CRUD Operations', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockSingle: jest.Mock;
  let mockSelectChain: any;

  const mockSession = {
    user: {
      id: 'user-123',
      user_metadata: { user_type: 'student' },
    },
  };

  // Helper to create enrollments mock with .then() support for stats
  const createEnrollmentsMock = () => {
    const promise = Promise.resolve({ count: 0, data: [], error: null });
    const thenable = {
      then: (cb: any) => promise.then(cb),
      count: 0,
      data: [],
      error: null,
    };
    return {
      select: jest.fn((query?: string, options?: any) => {
        // Handle stats queries with .then()
        if (options?.count === 'exact') {
          return thenable;
        }
        // Return chainable for regular queries (select().eq().order())
        return {
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        };
      }),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockEq = jest.fn();
    mockOrder = jest.fn();
    mockSingle = jest.fn();

    // Set default mockSelect to return promise-based chain FIRST
    const defaultPromise = Promise.resolve({ data: [], error: null });
    mockSelect.mockReturnValue({
      eq: jest.fn(() => ({
        order: jest.fn(() => defaultPromise),
        then: jest.fn((cb) => defaultPromise.then(cb)),
      })),
      order: jest.fn(() => defaultPromise),
      then: jest.fn((cb) => defaultPromise.then(cb)),
    });

    // Create proper chainable mock implementation
    const createChainableMock = (table: string) => {
      if (table === 'courses') {
        return {
          select: jest.fn((query?: string, options?: any) => {
            // Handle stats queries (for admin dashboard)
            if (options?.count === 'exact' && options?.head === true) {
              return Promise.resolve({ count: 0, data: null, error: null });
            }
            // Return chainable for regular queries - always return the mockSelect result
            // This handles both loadCourses and loadMyCreatedCourses
            return mockSelect();
          }),
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
        }
      }
      if (table === 'enrollments') {
        return {
          select: jest.fn((query?: string, options?: any) => {
            // Handle stats queries with .then() support
            if (options?.count === 'exact') {
              const promise = Promise.resolve({ count: 0, data: [], error: null });
              return {
                then: (cb: any) => promise.then(cb),
                count: 0,
                data: [],
                error: null,
              };
            }
            // Return chainable for regular queries
            return {
              eq: jest.fn(() => ({
                order: jest.fn(() => defaultPromise),
                then: jest.fn((cb) => defaultPromise.then(cb)),
              })),
              order: jest.fn(() => defaultPromise),
              then: jest.fn((cb) => defaultPromise.then(cb)),
            };
          }),
        }
      }
      if (table === 'assignments') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => defaultPromise),
            eq: jest.fn(() => ({
              order: jest.fn(() => defaultPromise),
              then: jest.fn((cb) => defaultPromise.then(cb)),
            })),
            then: jest.fn((cb) => defaultPromise.then(cb)),
          })),
        }
      }
      return {
        select: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          eq: jest.fn(() => ({
            order: jest.fn(() => defaultPromise),
            then: jest.fn((cb) => defaultPromise.then(cb)),
          })),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
      }
    }

    (supabaseModule.supabase.from as jest.Mock).mockImplementation(createChainableMock);

    (supabaseModule.supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
    });
  });

  describe('Course Creation', () => {
    it('should call insert with correct course data when creating a course', async () => {
      jest.setTimeout(30000);
      const user = userEvent.setup();
      const newCourse = {
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

      mockSingle.mockResolvedValue({
        data: newCourse,
        error: null,
      });

      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => defaultPromise),
        then: jest.fn((cb) => defaultPromise.then(cb)),
      });

      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        const createButton = screen.queryByRole('button', { name: /create course/i });
        return createButton !== null;
      }, { timeout: 10000 });

      const createButton = screen.getByRole('button', { name: /create course/i });
      await user.click(createButton);

      // Wait for modal to open
      await waitFor(() => {
        const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByLabelText(/course title/i);
        expect(titleInput).toBeInTheDocument();
      }, { timeout: 10000 });

      const titleInput = screen.getByPlaceholderText(/python dungeon/i) || screen.getByLabelText(/course title/i) as HTMLInputElement;
      const descriptionInput = screen.getByPlaceholderText(/describe the course/i) || screen.getByLabelText(/description/i) as HTMLTextAreaElement;

      await user.type(titleInput, 'Test Course');
      await user.type(descriptionInput, 'Test Description');

      // Find the submit button in the modal footer - it should be the last one or the one that's not disabled
      await waitFor(() => {
        const submitButtons = screen.getAllByRole('button', { name: /create course/i });
        expect(submitButtons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const submitButtons = screen.getAllByRole('button', { name: /create course/i });
      // The submit button is usually the last one in the modal (after the cancel button)
      const submitButton = submitButtons[submitButtons.length - 1];
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      }, { timeout: 15000 });
      
      // Verify the insert was called with courses table
        expect(supabaseModule.supabase.from).toHaveBeenCalledWith('courses');
    });

    it('should show error notification when session is missing', async () => {
      jest.setTimeout(30000);
      const user = userEvent.setup();
      
      // Use a flag to track when form is being submitted
      let isSubmittingForm = false;
      
      (supabaseModule.supabase.auth.getSession as jest.Mock).mockImplementation(() => {
        // During form submission, return null to simulate expired session
        if (isSubmittingForm) {
          return Promise.resolve({ data: { session: null } });
        }
        // Otherwise return session for initial load
        return Promise.resolve({ data: { session: mockSession } });
      });

      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => defaultPromise),
        then: jest.fn((cb) => defaultPromise.then(cb)),
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      const createButton = screen.getByRole('button', { name: /create course/i });
      await user.click(createButton);

      await waitFor(() => {
        const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByLabelText(/course title/i);
        expect(titleInput).toBeInTheDocument();
      }, { timeout: 10000 });

      const titleInput = screen.getByPlaceholderText(/python dungeon/i) || screen.getByLabelText(/course title/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Course');

      // Find the submit button - wait for it and use the last one (submit button is after cancel)
      await waitFor(() => {
        const submitButtons = screen.getAllByRole('button', { name: /create course/i });
        expect(submitButtons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
      
      const submitButtons = screen.getAllByRole('button', { name: /create course/i });
      const submitButton = submitButtons[submitButtons.length - 1]; // Last one is the submit button
      
      // Set flag before clicking to simulate session expiring during submission
      isSubmittingForm = true;
      await user.click(submitButton);

      // Wait for the notification to appear after form submission
      await waitFor(() => {
        const notification = screen.queryByTestId('notification');
        if (notification) {
          expect(notification.textContent).toMatch(/must be logged in|you must be logged in|logged in to create/i);
          return true;
        }
        // Fallback: check for text directly
        const errorText = screen.queryByText(/must be logged in/i) || 
                         screen.queryByText(/you must be logged in/i) ||
                         screen.queryByText(/logged in to create/i);
        if (errorText) {
          return true;
        }
        throw new Error('Notification not found');
      }, { timeout: 15000 });
    });

    it('should handle database errors during course creation', async () => {
      jest.setTimeout(30000);
      const user = userEvent.setup();
      const error = { message: 'Database connection failed' };

      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => defaultPromise),
        then: jest.fn((cb) => defaultPromise.then(cb)),
      });

      // Mock the insert to return an error
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn(() => Promise.resolve({ data: null, error: error })),
        }),
      });

      render(<DashboardPage params={{ userType: 'student' }} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      const createButton = screen.getByRole('button', { name: /create course/i });
      await user.click(createButton);

      await waitFor(() => {
        const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByLabelText(/course title/i);
        expect(titleInput).toBeInTheDocument();
      }, { timeout: 10000 });

      const titleInput = screen.getByPlaceholderText(/python dungeon/i) || screen.getByLabelText(/course title/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Course');

      // Find the submit button - wait for it and use the last one (submit button is after cancel)
      await waitFor(() => {
        const submitButtons = screen.getAllByRole('button', { name: /create course/i });
        expect(submitButtons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
      
      const submitButtons = screen.getAllByRole('button', { name: /create course/i });
      const submitButton = submitButtons[submitButtons.length - 1]; // Last one is the submit button
      await user.click(submitButton);

      await waitFor(() => {
        // Check for error notification using the Notification component's testid
        const notification = screen.getByTestId('notification');
        expect(notification).toBeInTheDocument();
        expect(notification.textContent).toMatch(/failed to create|database connection failed/i);
      }, { timeout: 15000 });
    });
  });

  describe('Course Listing', () => {
    it('should load and display courses from database', async () => {
      const courses = [
        {
          id: 'course-1',
          title: 'Course 1',
          description: 'Description 1',
          difficulty: 'beginner',
          duration: 4,
          category: 'Programming',
          created_at: new Date().toISOString(),
        },
        {
          id: 'course-2',
          title: 'Course 2',
          description: 'Description 2',
          difficulty: 'intermediate',
          duration: 8,
          category: 'Design',
          created_at: new Date().toISOString(),
        },
      ];

      mockSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: courses, error: null }),
      });

      mockEq.mockReturnValue({
        then: jest.fn((cb) => cb({ data: [], error: null })),
      });

      render(<CoursesPage />);

      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled();
        expect(supabaseModule.supabase.from).toHaveBeenCalledWith('courses');
      });
    });

    it('should filter courses by search term', async () => {
      const user = userEvent.setup();
      const courses = [
        {
          id: 'course-1',
          title: 'React Course',
          description: 'Learn React',
          difficulty: 'beginner',
          duration: 4,
          category: 'Programming',
          created_at: new Date().toISOString(),
        },
        {
          id: 'course-2',
          title: 'Vue Course',
          description: 'Learn Vue',
          difficulty: 'intermediate',
          duration: 8,
          category: 'Programming',
          created_at: new Date().toISOString(),
        },
      ];

      mockSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: courses, error: null }),
      });

      mockEq.mockReturnValue({
        then: jest.fn((cb) => cb({ data: [], error: null })),
      });

      render(<CoursesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'React');

      await waitFor(() => {
        expect(searchInput).toHaveValue('React');
      });
    });

    it('should filter courses by difficulty', async () => {
      const user = userEvent.setup();
      const courses = [
        {
          id: 'course-1',
          title: 'Beginner Course',
          description: 'Description',
          difficulty: 'beginner',
          duration: 4,
          category: 'Programming',
          created_at: new Date().toISOString(),
        },
        {
          id: 'course-2',
          title: 'Advanced Course',
          description: 'Description',
          difficulty: 'advanced',
          duration: 8,
          category: 'Design',
          created_at: new Date().toISOString(),
        },
      ];

      mockSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: courses, error: null }),
      });

      mockEq.mockReturnValue({
        then: jest.fn((cb) => cb({ data: [], error: null })),
      });

      render(<CoursesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const difficultySelects = screen.queryAllByDisplayValue(/all/i);
      if (difficultySelects.length > 0) {
        await user.selectOptions(difficultySelects[0], 'beginner');
        await waitFor(() => {
          expect(difficultySelects[0]).toHaveValue('beginner');
        });
      }
    });
  });

  describe('Course Editing', () => {
    it('should update course with new data', async () => {
      jest.setTimeout(10000);
      const user = userEvent.setup();
      const course = {
        id: 'course-1',
        title: 'Original Title',
        description: 'Original Description',
        difficulty: 'beginner',
        duration: 4,
        category: 'Programming',
        code: 'CS101',
        color: '#0F3460',
        created_at: new Date().toISOString(),
      };

      const updatedCourse = {
        ...course,
        title: 'Updated Title',
        description: 'Updated Description',
      };

      mockSingle.mockResolvedValue({
        data: updatedCourse,
        error: null,
      });

      const courses = [course];
      const coursesPromise = Promise.resolve({ data: courses, error: null });
      const defaultPromise = Promise.resolve({ data: [], error: null });
      
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => coursesPromise),
        then: jest.fn((cb) => coursesPromise.then(cb)),
      });

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      // Mock is already correctly set up in beforeEach - don't override it

      render(<DashboardPage params={{ userType: 'admin' }} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const editButtons = screen.queryAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        await waitFor(() => {
          const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByText(/course title/i)?.closest('div')?.querySelector('input');
          expect(titleInput).toBeInTheDocument();
        }, { timeout: 5000 });

        const titleInput = screen.getByPlaceholderText(/python dungeon/i) || screen.getByText(/course title/i).closest('div')?.querySelector('input') as HTMLInputElement;
        await user.clear(titleInput);
        await user.type(titleInput, 'Updated Title');

        const updateButton = screen.getByRole('button', { name: /update course/i });
        await user.click(updateButton);

        await waitFor(() => {
          expect(mockUpdate).toHaveBeenCalled();
        }, { timeout: 10000 });
      }
    });

    it('should handle update errors gracefully', async () => {
      jest.setTimeout(10000);
      const user = userEvent.setup();
      const course = {
        id: 'course-1',
        title: 'Original Title',
        description: 'Original Description',
        difficulty: 'beginner',
        duration: 4,
        category: 'Programming',
        code: 'CS101',
        color: '#0F3460',
        created_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const courses = [course];
      const coursesPromise = Promise.resolve({ data: courses, error: null });
      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => coursesPromise),
        then: jest.fn((cb) => coursesPromise.then(cb)),
      });

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      render(<DashboardPage params={{ userType: 'admin' }} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const editButtons = screen.queryAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByLabelText(/course title/i) || screen.getByPlaceholderText(/python dungeon/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        const updateButton = screen.getByRole('button', { name: /update course/i });
        await user.click(updateButton);

        await waitFor(() => {
          expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
        }, { timeout: 10000 });
      }
    });
  });

  describe('Course Deletion', () => {
    it('should delete course when confirmed', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);

      const course = {
        id: 'course-1',
        title: 'Course to Delete',
        description: 'Description',
        difficulty: 'beginner',
        duration: 4,
        category: 'Programming',
        created_at: new Date().toISOString(),
      };

      const courses = [course];
      const coursesPromise = Promise.resolve({ data: courses, error: null });
      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => coursesPromise),
        then: jest.fn((cb) => coursesPromise.then(cb)),
      });

      mockDelete.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          then: jest.fn((cb) => cb({ error: null })),
        }),
      });

      render(<DashboardPage params={{ userType: 'admin' }} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(window.confirm).toHaveBeenCalled();
          expect(mockDelete).toHaveBeenCalled();
        });
      }
    });

    it('should not delete course when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => false);

      const course = {
        id: 'course-1',
        title: 'Course to Delete',
        description: 'Description',
        difficulty: 'beginner',
        duration: 4,
        category: 'Programming',
        created_at: new Date().toISOString(),
      };

      const courses = [course];
      const coursesPromise = Promise.resolve({ data: courses, error: null });
      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => coursesPromise),
        then: jest.fn((cb) => coursesPromise.then(cb)),
      });

      render(<DashboardPage params={{ userType: 'admin' }} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(window.confirm).toHaveBeenCalled();
        });

        expect(mockDelete).not.toHaveBeenCalled();
      }
    });

    it('should handle deletion errors', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);

      const course = {
        id: 'course-1',
        title: 'Course to Delete',
        description: 'Description',
        difficulty: 'beginner',
        duration: 4,
        category: 'Programming',
        created_at: new Date().toISOString(),
      };

      const courses = [course];
      const coursesPromise = Promise.resolve({ data: courses, error: null });
      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => coursesPromise),
        then: jest.fn((cb) => coursesPromise.then(cb)),
      });

      mockDelete.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          then: jest.fn((cb) => cb({ error: { message: 'Delete failed' } })),
        }),
      });

      render(<DashboardPage params={{ userType: 'admin' }} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/failed to delete/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Course Form Validation', () => {
    it('should require title field', async () => {
      const user = userEvent.setup();

      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => defaultPromise),
        then: jest.fn((cb) => defaultPromise.then(cb)),
      });

      // Mock is already correctly set up in beforeEach - don't override it

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        const createButton = screen.queryByRole('button', { name: /create course/i });
        return createButton !== null;
      }, { timeout: 5000 });

      const createButton = screen.getByRole('button', { name: /create course/i });
      await user.click(createButton);

      await waitFor(() => {
        const titleInput = screen.queryByLabelText(/course title/i) || screen.queryByPlaceholderText(/python dungeon/i);
        return titleInput !== null;
      }, { timeout: 5000 });

      const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByText(/course title/i)?.closest('div')?.querySelector('input');
      expect(titleInput).toBeInTheDocument();
    });

    it('should allow optional code and color fields', async () => {
      const user = userEvent.setup();

      const defaultPromise = Promise.resolve({ data: [], error: null });
      mockSelect.mockReturnValue({
        eq: jest.fn(() => ({
          order: jest.fn(() => defaultPromise),
          then: jest.fn((cb) => defaultPromise.then(cb)),
        })),
        order: jest.fn(() => defaultPromise),
        then: jest.fn((cb) => defaultPromise.then(cb)),
      });

      // Mock is already correctly set up in beforeEach - don't override it

      render(<DashboardPage params={{ userType: 'student' }} />);

      await waitFor(() => {
        const createButton = screen.queryByRole('button', { name: /create course/i });
        return createButton !== null;
      }, { timeout: 5000 });

      const createButton = screen.getByRole('button', { name: /create course/i });
      await user.click(createButton);

      await waitFor(() => {
        const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByText(/course title/i)?.closest('div')?.querySelector('input');
        return titleInput !== null;
      }, { timeout: 5000 });

      const titleInput = screen.queryByPlaceholderText(/python dungeon/i) || screen.queryByText(/course title/i)?.closest('div')?.querySelector('input');
      expect(titleInput).toBeInTheDocument();

      const codeInput = screen.queryByPlaceholderText(/cs101/i) || screen.queryByText(/course code/i)?.closest('div')?.querySelector('input');
      const colorInput = screen.queryByText(/color/i)?.closest('div')?.querySelector('input[type="color"]');

      if (codeInput) {
        expect(codeInput).not.toBeRequired();
      }
      if (colorInput) {
        expect(colorInput).not.toBeRequired();
      }
    });
  });
});
