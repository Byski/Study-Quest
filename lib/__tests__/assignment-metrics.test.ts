import {
  calculateAssignmentCompletionRate,
  calculatePlanningAccuracy,
  calculatePriorityDistribution,
  calculateWeeklyProgress,
  calculateCourseProgress,
  getMetricsInterpretation,
  type Assignment,
  type AssignmentSubmission,
} from '../metrics';

describe('calculateAssignmentCompletionRate', () => {
  it('should return 0 for empty assignments', () => {
    expect(calculateAssignmentCompletionRate([], [])).toBe(0);
  });

  it('should calculate completion rate correctly', () => {
    const assignments: Assignment[] = [
      { id: '1', courseId: 'c1', title: 'Assignment 1', status: 'todo', priority: 'high' },
      { id: '2', courseId: 'c1', title: 'Assignment 2', status: 'todo', priority: 'medium' },
      { id: '3', courseId: 'c2', title: 'Assignment 3', status: 'todo', priority: 'low' },
    ];

    const submissions: AssignmentSubmission[] = [
      { id: 's1', assignmentId: '1', studentId: 'u1', status: 'submitted' },
      { id: 's2', assignmentId: '2', studentId: 'u1', status: 'graded' },
    ];

    // 2 out of 3 completed = 66.67%
    expect(calculateAssignmentCompletionRate(assignments, submissions)).toBeCloseTo(66.67, 1);
  });

  it('should return 100 for all completed', () => {
    const assignments: Assignment[] = [
      { id: '1', courseId: 'c1', title: 'Assignment 1', status: 'done', priority: 'high' },
    ];

    const submissions: AssignmentSubmission[] = [
      { id: 's1', assignmentId: '1', studentId: 'u1', status: 'graded' },
    ];

    expect(calculateAssignmentCompletionRate(assignments, submissions)).toBe(100);
  });
});

describe('calculatePlanningAccuracy', () => {
  it('should return 0 for empty submissions', () => {
    expect(calculatePlanningAccuracy([])).toBe(0);
  });

  it('should calculate accuracy correctly', () => {
    const submissions: AssignmentSubmission[] = [
      { id: '1', assignmentId: 'a1', studentId: 'u1', status: 'graded', estimatedHours: 10, actualHours: 10 },
      { id: '2', assignmentId: 'a2', studentId: 'u1', status: 'graded', estimatedHours: 5, actualHours: 6 },
      { id: '3', assignmentId: 'a3', studentId: 'u1', status: 'graded', estimatedHours: 8, actualHours: 4 },
    ];

    // First: 100% accuracy (10-10=0)
    // Second: 80% accuracy (5-1=4, 4/5*100=20% difference, 100-20=80%)
    // Third: 50% accuracy (8-4=4, 4/8*100=50% difference, 100-50=50%)
    // Average: (100+80+50)/3 = 76.67%
    const accuracy = calculatePlanningAccuracy(submissions);
    expect(accuracy).toBeCloseTo(76.67, 1);
  });

  it('should ignore submissions without both estimated and actual hours', () => {
    const submissions: AssignmentSubmission[] = [
      { id: '1', assignmentId: 'a1', studentId: 'u1', status: 'graded', estimatedHours: 10 },
      { id: '2', assignmentId: 'a2', studentId: 'u1', status: 'graded', actualHours: 5 },
      { id: '3', assignmentId: 'a3', studentId: 'u1', status: 'graded', estimatedHours: 8, actualHours: 8 },
    ];

    expect(calculatePlanningAccuracy(submissions)).toBe(100);
  });
});

describe('calculatePriorityDistribution', () => {
  it('should return zeros for empty array', () => {
    expect(calculatePriorityDistribution([])).toEqual({
      high: 0,
      medium: 0,
      low: 0,
    });
  });

  it('should count priorities correctly', () => {
    const assignments: Assignment[] = [
      { id: '1', courseId: 'c1', title: 'A1', status: 'todo', priority: 'high' },
      { id: '2', courseId: 'c1', title: 'A2', status: 'todo', priority: 'high' },
      { id: '3', courseId: 'c1', title: 'A3', status: 'todo', priority: 'medium' },
      { id: '4', courseId: 'c1', title: 'A4', status: 'todo', priority: 'low' },
    ];

    expect(calculatePriorityDistribution(assignments)).toEqual({
      high: 2,
      medium: 1,
      low: 1,
    });
  });
});

describe('calculateWeeklyProgress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return empty array for no assignments', () => {
    expect(calculateWeeklyProgress([], [])).toEqual([]);
  });

  it('should group assignments by week', () => {
    // Mock date: Monday, Jan 15, 2024
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

    const assignments: Assignment[] = [
      { id: '1', courseId: 'c1', title: 'A1', status: 'todo', priority: 'high', dueDate: new Date('2024-01-15') },
      { id: '2', courseId: 'c1', title: 'A2', status: 'todo', priority: 'medium', dueDate: new Date('2024-01-16') },
      { id: '3', courseId: 'c1', title: 'A3', status: 'todo', priority: 'low', dueDate: new Date('2024-01-22') },
    ];

    const submissions: AssignmentSubmission[] = [
      { id: 's1', assignmentId: '1', studentId: 'u1', status: 'submitted' },
    ];

    const progress = calculateWeeklyProgress(assignments, submissions);
    expect(progress.length).toBeGreaterThan(0);
    const currentWeek = progress.find((p) => p.weekStart === '2024-01-15');
    expect(currentWeek).toBeDefined();
    expect(currentWeek?.total).toBe(2); // Two assignments in same week
    expect(currentWeek?.completed).toBe(1);
  });
});

describe('calculateCourseProgress', () => {
  it('should return empty array for no assignments', () => {
    expect(calculateCourseProgress([], [])).toEqual([]);
  });

  it('should calculate progress per course', () => {
    const assignments: Assignment[] = [
      { id: '1', courseId: 'c1', title: 'A1', status: 'todo', priority: 'high' },
      { id: '2', courseId: 'c1', title: 'A2', status: 'todo', priority: 'medium' },
      { id: '3', courseId: 'c2', title: 'A3', status: 'todo', priority: 'low' },
    ];

    const submissions: AssignmentSubmission[] = [
      { id: 's1', assignmentId: '1', studentId: 'u1', status: 'submitted' },
      { id: 's2', assignmentId: '2', studentId: 'u1', status: 'submitted' },
    ];

    const progress = calculateCourseProgress(assignments, submissions);
    expect(progress.length).toBe(2);
    
    const c1Progress = progress.find((p) => p.courseId === 'c1');
    expect(c1Progress?.completion).toBe(100); // 2/2 completed

    const c2Progress = progress.find((p) => p.courseId === 'c2');
    expect(c2Progress?.completion).toBe(0); // 0/1 completed
  });
});

describe('getMetricsInterpretation', () => {
  it('should return excellent level for high scores', () => {
    const metrics = {
      completionRate: 90,
      planningAccuracy: 85,
      priorityDistribution: { high: 2, medium: 3, low: 1 },
      weeklyProgress: [],
      courseProgress: [],
    };

    const result = getMetricsInterpretation(metrics);
    expect(result.level).toBe('excellent');
    expect(result.message).toContain('excellent');
  });

  it('should return needs-improvement for low scores', () => {
    const metrics = {
      completionRate: 30,
      planningAccuracy: 40,
      priorityDistribution: { high: 5, medium: 2, low: 1 },
      weeklyProgress: [
        { weekStart: '2024-01-01', completed: 1, total: 5 },
      ],
      courseProgress: [
        { courseId: 'c1', completion: 20 },
      ],
    };

    const result = getMetricsInterpretation(metrics);
    expect(result.level).toBe('needs-improvement');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should provide recommendations based on metrics', () => {
    const metrics = {
      completionRate: 50,
      planningAccuracy: 60,
      priorityDistribution: { high: 5, medium: 2, low: 1 },
      weeklyProgress: [
        { weekStart: '2024-01-01', completed: 1, total: 5 },
      ],
      courseProgress: [
        { courseId: 'c1', completion: 30 },
      ],
    };

    const result = getMetricsInterpretation(metrics);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations).toContainEqual(
      expect.stringContaining('completion')
    );
  });
});

