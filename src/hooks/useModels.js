import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/api';

const PERSONALITY_STORAGE_KEY = 'omnibot_personality';

function mergeStoredPersonality(data) {
  if (!data?.active) return data;
  try {
    const stored = localStorage.getItem(PERSONALITY_STORAGE_KEY);
    if (stored && data.personalities?.some((p) => p.id === stored)) {
      return { ...data, active: { ...data.active, personality: stored } };
    }
  } catch {
    // localStorage unavailable
  }
  return data;
}

export function useModels() {
  const [config, setConfig] = useState(null);
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
      const data = mergeStoredPersonality(await response.json());
      setConfig(data);
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
      if (updates.personality) {
        try {
          localStorage.setItem(PERSONALITY_STORAGE_KEY, updates.personality);
        } catch {
          // localStorage unavailable
        }
      }

      const response = await fetch(apiUrl('models'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = mergeStoredPersonality(await response.json());
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update models');
      }
      setConfig(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { config, loading, error, saving, refreshModels, updateModels };
}
