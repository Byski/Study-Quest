import {
  calculateTotalStudyTime,
  calculateStudyTimeBySubject,
  calculateStudyTimeInRange,
  calculateGoalProgress,
  calculateAverageSessionDuration,
  calculateStudyStreak,
  calculateTodayStudyTime,
  calculateThisWeekStudyTime,
  calculateThisMonthStudyTime,
  getMostStudiedSubject,
  calculateCompletionRate,
  type StudySession,
  type StudyGoal,
} from '../metrics';

describe('calculateTotalStudyTime', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotalStudyTime([])).toBe(0);
  });

  it('should sum durations of completed sessions only', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date(), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date(), completed: false },
    ];
    expect(calculateTotalStudyTime(sessions)).toBe(75);
  });

  it('should ignore incomplete sessions', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: false },
      { id: '2', duration: 45, subject: 'Science', date: new Date(), completed: false },
    ];
    expect(calculateTotalStudyTime(sessions)).toBe(0);
  });
});

describe('calculateStudyTimeBySubject', () => {
  it('should return empty object for empty array', () => {
    expect(calculateStudyTimeBySubject([])).toEqual({});
  });

  it('should group study time by subject', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Math', date: new Date(), completed: true },
      { id: '3', duration: 20, subject: 'Science', date: new Date(), completed: true },
    ];
    expect(calculateStudyTimeBySubject(sessions)).toEqual({
      Math: 75,
      Science: 20,
    });
  });

  it('should ignore incomplete sessions', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Math', date: new Date(), completed: false },
    ];
    expect(calculateStudyTimeBySubject(sessions)).toEqual({
      Math: 30,
    });
  });
});

describe('calculateStudyTimeInRange', () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  it('should return 0 for empty array', () => {
    expect(calculateStudyTimeInRange([], startDate, endDate)).toBe(0);
  });

  it('should only include sessions within date range', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-15'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-02-01'), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date('2023-12-31'), completed: true },
    ];
    expect(calculateStudyTimeInRange(sessions, startDate, endDate)).toBe(30);
  });

  it('should include sessions on boundary dates', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-01'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-31'), completed: true },
    ];
    expect(calculateStudyTimeInRange(sessions, startDate, endDate)).toBe(75);
  });

  it('should ignore incomplete sessions', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-15'), completed: false },
    ];
    expect(calculateStudyTimeInRange(sessions, startDate, endDate)).toBe(0);
  });
});

describe('calculateGoalProgress', () => {
  const goal: StudyGoal = {
    id: '1',
    subject: 'Math',
    targetHours: 10,
    period: 'weekly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07'),
  };

  it('should return 0 when no sessions match', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Science', date: new Date('2024-01-02'), completed: true },
    ];
    expect(calculateGoalProgress(goal, sessions)).toBe(0);
  });

  it('should calculate progress correctly', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 300, subject: 'Math', date: new Date('2024-01-02'), completed: true }, // 5 hours
      { id: '2', duration: 180, subject: 'Math', date: new Date('2024-01-05'), completed: true }, // 3 hours
    ];
    // 8 hours out of 10 hours = 80%
    expect(calculateGoalProgress(goal, sessions)).toBe(80);
  });

  it('should cap progress at 100%', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 600, subject: 'Math', date: new Date('2024-01-02'), completed: true }, // 10 hours
      { id: '2', duration: 120, subject: 'Math', date: new Date('2024-01-05'), completed: true }, // 2 hours
    ];
    expect(calculateGoalProgress(goal, sessions)).toBe(100);
  });

  it('should only count sessions within date range', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 300, subject: 'Math', date: new Date('2024-01-02'), completed: true },
      { id: '2', duration: 300, subject: 'Math', date: new Date('2024-01-10'), completed: true }, // Outside range
    ];
    expect(calculateGoalProgress(goal, sessions)).toBe(50);
  });
});

describe('calculateAverageSessionDuration', () => {
  it('should return 0 for empty array', () => {
    expect(calculateAverageSessionDuration([])).toBe(0);
  });

  it('should calculate average correctly', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date(), completed: true },
      { id: '3', duration: 15, subject: 'English', date: new Date(), completed: true },
    ];
    expect(calculateAverageSessionDuration(sessions)).toBe(30);
  });

  it('should ignore incomplete sessions', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date(), completed: false },
    ];
    expect(calculateAverageSessionDuration(sessions)).toBe(30);
  });
});

describe('calculateStudyStreak', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return 0 for empty array', () => {
    expect(calculateStudyStreak([])).toBe(0);
  });

  it('should calculate streak for consecutive days', () => {
    // Mock today as 2024-01-05
    jest.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-05'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-04'), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date('2024-01-03'), completed: true },
    ];
    expect(calculateStudyStreak(sessions)).toBe(3);
  });

  it('should return 0 if streak is broken', () => {
    jest.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-05'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-03'), completed: true }, // Gap on 2024-01-04
    ];
    expect(calculateStudyStreak(sessions)).toBe(1);
  });

  it('should handle multiple sessions on same day', () => {
    jest.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-05'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-05'), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date('2024-01-04'), completed: true },
    ];
    expect(calculateStudyStreak(sessions)).toBe(2);
  });

  it('should start from yesterday if no session today', () => {
    jest.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-04'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-03'), completed: true },
    ];
    expect(calculateStudyStreak(sessions)).toBe(2);
  });

  it('should return 0 if no recent sessions', () => {
    jest.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-01'), completed: true },
    ];
    expect(calculateStudyStreak(sessions)).toBe(0);
  });
});

describe('calculateTodayStudyTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return 0 for empty array', () => {
    expect(calculateTodayStudyTime([])).toBe(0);
  });

  it('should calculate study time for today only', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-15'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-15'), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date('2024-01-14'), completed: true },
    ];
    expect(calculateTodayStudyTime(sessions)).toBe(75);
  });
});

describe('calculateThisWeekStudyTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return 0 for empty array', () => {
    expect(calculateThisWeekStudyTime([])).toBe(0);
  });

  it('should calculate study time for current week', () => {
    // Mock Monday, Jan 15, 2024
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-15'), completed: true }, // Monday
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-16'), completed: true }, // Tuesday
      { id: '3', duration: 20, subject: 'English', date: new Date('2024-01-07'), completed: true }, // Previous week
    ];
    expect(calculateThisWeekStudyTime(sessions)).toBe(75);
  });
});

describe('calculateThisMonthStudyTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return 0 for empty array', () => {
    expect(calculateThisMonthStudyTime([])).toBe(0);
  });

  it('should calculate study time for current month', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date('2024-01-10'), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date('2024-01-20'), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date('2023-12-31'), completed: true },
    ];
    expect(calculateThisMonthStudyTime(sessions)).toBe(75);
  });
});

describe('getMostStudiedSubject', () => {
  it('should return null for empty array', () => {
    expect(getMostStudiedSubject([])).toBeNull();
  });

  it('should return the subject with most study time', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Math', date: new Date(), completed: true },
      { id: '3', duration: 20, subject: 'Science', date: new Date(), completed: true },
    ];
    const result = getMostStudiedSubject(sessions);
    expect(result).toEqual({ subject: 'Math', minutes: 75 });
  });

  it('should handle ties by returning the first one encountered', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 30, subject: 'Science', date: new Date(), completed: true },
    ];
    const result = getMostStudiedSubject(sessions);
    expect(result).not.toBeNull();
    expect(result?.minutes).toBe(30);
  });
});

describe('calculateCompletionRate', () => {
  it('should return 0 for empty array', () => {
    expect(calculateCompletionRate([])).toBe(0);
  });

  it('should calculate completion rate correctly', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date(), completed: true },
      { id: '3', duration: 20, subject: 'English', date: new Date(), completed: false },
    ];
    expect(calculateCompletionRate(sessions)).toBeCloseTo(66.67, 1);
  });

  it('should return 100 for all completed sessions', () => {
    const sessions: StudySession[] = [
      { id: '1', duration: 30, subject: 'Math', date: new Date(), completed: true },
      { id: '2', duration: 45, subject: 'Science', date: new Date(), completed: true },
    ];
    expect(calculateCompletionRate(sessions)).toBe(100);
  });
});

