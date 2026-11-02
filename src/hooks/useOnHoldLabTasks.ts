import { useCallback, useEffect, useRef, useState } from 'react';
import { labTaskService, type LabTaskItem } from '../services/lab/lab-task.service';

export interface UseOnHoldLabTasksOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export function useOnHoldLabTasks(encounterId?: string, options: UseOnHoldLabTasksOptions = {}) {
  const { enabled = true, intervalMs = 25000 } = options;
  const [onHoldTasks, setOnHoldTasks] = useState<LabTaskItem[]>([]);
  const [allTasks, setAllTasks] = useState<LabTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      // Query tasks with on_hold
      const tasks = await labTaskService.getLabTasks({ status: 'on_hold' });
      setAllTasks(tasks);

      let filtered: LabTaskItem[] = [];
      if (encounterId) {
        filtered = tasks.filter(
          (t) =>
            t.orderItem?.order?.encounter?.encounterId === encounterId ||
            t.orderItem?.order?.encounter?.encounterCode === encounterId ||
            (t.orderItem?.order as unknown as { encounterId?: string })?.encounterId === encounterId,
        );
      } else if (encounterId === undefined) {
        filtered = tasks;
      } else {
        // encounterId === ''
        filtered = [];
      }

      setOnHoldTasks(filtered);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách sự cố cận lâm sàng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [enabled, encounterId]);

  const fetchRef = useRef(fetchTasks);
  fetchRef.current = fetchTasks;

  useEffect(() => {
    if (!enabled) return;
    void fetchRef.current();

    const interval = setInterval(() => {
      // Pause polling if the tab is hidden
      if (document.hidden) return;
      void fetchRef.current();
    }, intervalMs);

    const onVisibilityChange = () => {
      if (!document.hidden && enabled) {
        void fetchRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, intervalMs, encounterId]);

  return {
    onHoldTasks,
    allTasks,
    count: onHoldTasks.length,
    loading,
    error,
    refetch: fetchTasks,
  };
}
