import { useCallback, useEffect, useState } from 'react';
import { api, getApiToken } from '../../lib/api';
import { useSession } from '../../app/session/SessionProvider';

export interface NormalizedLearningRecord {
  pathId: string;
  status: 'In Progress' | 'Saved' | 'Completed';
  progress: number;
  updatedAt?: string;
}

export interface NormalizedLearningGoal {
  id: string;
  goal: string;
  createdAt?: string;
}

export interface LearnStateResult {
  records: NormalizedLearningRecord[];
  goals: NormalizedLearningGoal[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  updateRecord: (
    pathId: string,
    status: 'In Progress' | 'Saved' | 'Completed',
    progress: number
  ) => Promise<NormalizedLearningRecord | null>;
  addGoal: (goal: string) => Promise<NormalizedLearningGoal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
}

function normalizeRecord(raw: any): NormalizedLearningRecord {
  const pathId = String(raw.pathId || raw.path_id || '');
  const status =
    raw.status === 'Completed' ? 'Completed' : raw.status === 'Saved' ? 'Saved' : 'In Progress';
  const progress =
    typeof raw.progress === 'number'
      ? Math.min(100, Math.max(0, Math.round(raw.progress)))
      : status === 'Completed'
      ? 100
      : 0;
  return {
    pathId,
    status,
    progress,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

function normalizeGoal(raw: any): NormalizedLearningGoal {
  return {
    id: String(raw.id || crypto.randomUUID()),
    goal: String(raw.goal || ''),
    createdAt: raw.created_at || raw.createdAt,
  };
}

export function useLearnState(): LearnStateResult {
  const { session } = useSession();
  const isAuthenticated = !!session;

  const [records, setRecords] = useState<NormalizedLearningRecord[]>([]);
  const [goals, setGoals] = useState<NormalizedLearningGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    if (!isAuthenticated) {
      setRecords([]);
      setGoals([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getApiToken();
      if (token) {
        const data = await api.learning.getState();
        const rawRecords = Array.isArray(data?.records) ? data.records : [];
        const rawGoals = Array.isArray(data?.goals) ? data.goals : [];

        setRecords(rawRecords.map(normalizeRecord));
        setGoals(rawGoals.map(normalizeGoal));
      } else {
        setRecords([]);
        setGoals([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch learning state';
      console.error('Failed to load server learning state:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const updateRecord = useCallback(
    async (
      pathId: string,
      status: 'In Progress' | 'Saved' | 'Completed',
      progress: number
    ): Promise<NormalizedLearningRecord | null> => {
      const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
      const optimistic: NormalizedLearningRecord = {
        pathId,
        status,
        progress: status === 'Completed' ? 100 : clampedProgress,
        updatedAt: new Date().toISOString(),
      };

      setRecords((prev) => {
        const filtered = prev.filter((r) => r.pathId !== pathId);
        return [optimistic, ...filtered];
      });

      try {
        const res = await api.learning.updateRecord(pathId, status, optimistic.progress);
        if (res) {
          const normalized = normalizeRecord(res);
          setRecords((prev) => [normalized, ...prev.filter((r) => r.pathId !== pathId)]);
          return normalized;
        }
        return optimistic;
      } catch (err) {
        console.error('Server updateRecord failed:', err);
        throw err;
      }
    },
    []
  );

  const addGoal = useCallback(
    async (goalText: string): Promise<NormalizedLearningGoal | null> => {
      const trimmed = goalText.trim();
      if (!trimmed) return null;

      const optimistic: NormalizedLearningGoal = {
        id: crypto.randomUUID(),
        goal: trimmed,
        createdAt: new Date().toISOString(),
      };

      setGoals((prev) => [optimistic, ...prev]);

      try {
        const res = await api.learning.addGoal(trimmed);
        if (res) {
          const normalized = normalizeGoal(res);
          setGoals((prev) => [normalized, ...prev.filter((g) => g.id !== optimistic.id)]);
          return normalized;
        }
        return optimistic;
      } catch (err) {
        console.error('Server addGoal failed:', err);
        setGoals((prev) => prev.filter((g) => g.id !== optimistic.id));
        throw err;
      }
    },
    []
  );

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    setGoals((prev) => prev.filter((g) => g.id !== id));

    try {
      await api.learning.deleteGoal(id);
      return true;
    } catch (err) {
      console.error('Server deleteGoal failed:', err);
      throw err;
    }
  }, []);

  return {
    records,
    goals,
    loading,
    error,
    isAuthenticated,
    refresh: fetchState,
    updateRecord,
    addGoal,
    deleteGoal,
  };
}
