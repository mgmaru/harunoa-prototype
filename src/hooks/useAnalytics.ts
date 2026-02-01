'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';
import { useAuth } from './useAuth';
import { useProjects } from './useProjects';
import { getSessionsByPeriod } from '@/services/sessions';
import {
  aggregateSessions,
  getPeriodRange,
  getPeriodLabel,
  PeriodType,
  AggregateItem,
} from '@/lib/date/aggregation';

export const useAnalytics = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<AggregateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const period = useMemo(
    () => getPeriodRange(periodType, currentDate),
    [periodType, currentDate]
  );
  const label = useMemo(
    () => getPeriodLabel(periodType, currentDate),
    [periodType, currentDate]
  );
  const totalMinutes = useMemo(
    () => items.reduce((a, b) => a + b.totalMinutes, 0),
    [items]
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const sessions = await getSessionsByPeriod(user.uid, period.start, period.end);
      const aggregated = aggregateSessions(sessions, projects, period.start, period.end);
      setItems(aggregated);
    } finally {
      setIsLoading(false);
    }
  }, [user, period, projects]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPrevious = useCallback(() => {
    setCurrentDate((d) => {
      switch (periodType) {
        case 'day':
          return subDays(d, 1);
        case 'week':
          return subWeeks(d, 1);
        case 'month':
          return subMonths(d, 1);
        case 'year':
          return subYears(d, 1);
      }
    });
  }, [periodType]);

  const goToNext = useCallback(() => {
    setCurrentDate((d) => {
      switch (periodType) {
        case 'day':
          return addDays(d, 1);
        case 'week':
          return addWeeks(d, 1);
        case 'month':
          return addMonths(d, 1);
        case 'year':
          return addYears(d, 1);
      }
    });
  }, [periodType]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    periodType,
    setPeriodType,
    currentDate,
    label,
    items,
    totalMinutes,
    isLoading,
    goToPrevious,
    goToNext,
    goToToday,
  };
};
