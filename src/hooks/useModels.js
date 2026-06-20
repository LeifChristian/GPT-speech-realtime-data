import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/api';

export function useModels() {
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const refreshModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('models'));
      if (!response.ok) {
        throw new Error('Failed to load models');
      }
      const data = await response.json();
      setModels(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshModels().catch(() => {});
  }, [refreshModels]);

  const updateModels = useCallback(async (updates) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('models'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update models');
      }
      setModels(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { models, loading, error, saving, refreshModels, updateModels };
}
