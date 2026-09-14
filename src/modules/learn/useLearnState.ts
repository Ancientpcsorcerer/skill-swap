import { useCallback, useEffect, useState } from 'react';
import { api, getApiToken } from '../../lib/api';
import { useSession } from '../../app/session/SessionProvider';
import { useWorkspace } from '../../app/data/WorkspaceProvider';

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
  const workspace = useWorkspace();
  const isAuthenticated = !!session;

  const [records, setRecords] = useState<NormalizedLearningRecord[]>(() => {
    if (!isAuthenticated) return [];
    return (workspace.learning || []).map(normalizeRecord);
  });

  const [goals, setGoals] = useState<NormalizedLearningGoal[]>(() => {
    if (!isAuthenticated) return [];
    return (workspace.goals || []).map((g) => ({
      id: g,
      goal: g,
      createdAt: new Date().toISOString(),
    }));
  });

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

        if (rawRecords.length > 0 || rawGoals.length > 0) {
          setRecords(rawRecords.map(normalizeRecord));
          setGoals(rawGoals.map(normalizeGoal));
        } else if (workspace.learning?.length || workspace.goals?.length) {
          setRecords((workspace.learning || []).map(normalizeRecord));
          setGoals(
            (workspace.goals || []).map((g) => ({
              id: g,
              goal: g,
              createdAt: new Date().toISOString(),
            }))
          );
        }
      } else if (workspace.learning?.length || workspace.goals?.length) {
        setRecords((workspace.learning || []).map(normalizeRecord));
        setGoals(
          (workspace.goals || []).map((g) => ({
            id: g,
            goal: g,
            createdAt: new Date().toISOString(),
          }))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch learning state';
      console.warn('⚠️ Could not load server learning state, using fallback:', msg);
      if (workspace.learning?.length || workspace.goals?.length) {
        setRecords((workspace.learning || []).map(normalizeRecord));
        setGoals(
          (workspace.goals || []).map((g) => ({
            id: g,
            goal: g,
            createdAt: new Date().toISOString(),
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, workspace.learning, workspace.goals]);

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

      // Synchronize with workspace controller
      workspace.setLearning(pathId, status);

      try {
        const token = getApiToken();
        if (token) {
          const res = await api.learning.updateRecord(pathId, status, optimistic.progress);
          if (res) {
            const normalized = normalizeRecord(res);
            setRecords((prev) => [normalized, ...prev.filter((r) => r.pathId !== pathId)]);
            return normalized;
          }
        }
        return optimistic;
      } catch (err) {
        console.warn('⚠️ Server updateRecord failed, kept local state:', err);
        return optimistic;
      }
    },
    [workspace]
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

      // Synchronize with workspace controller
      workspace.setGoal(trimmed);

      try {
        const token = getApiToken();
        if (token) {
          const res = await api.learning.addGoal(trimmed);
          if (res) {
            const normalized = normalizeGoal(res);
            setGoals((prev) => [normalized, ...prev.filter((g) => g.id !== optimistic.id)]);
            return normalized;
          }
        }
        return optimistic;
      } catch (err) {
        console.warn('⚠️ Server addGoal failed, kept local state:', err);
        return optimistic;
      }
    },
    [workspace]
  );

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    setGoals((prev) => prev.filter((g) => g.id !== id));

    try {
      const token = getApiToken();
      if (token) {
        await api.learning.deleteGoal(id);
      }
      return true;
    } catch (err) {
      console.warn('⚠️ Server deleteGoal failed:', err);
      return true;
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
