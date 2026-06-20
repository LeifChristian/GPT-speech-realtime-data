import React from 'react';
import PropTypes from 'prop-types';
import { Settings2 } from 'lucide-react';
import { GlassCard } from './ui/Card';

const ModelSelector = ({ models, loading, saving, error, onChange }) => {
  if (loading && !models) {
    return (
      <GlassCard className="fixed top-4 left-4 z-[60] p-3 text-white/70 text-sm">
        Loading models...
      </GlassCard>
    );
  }

  if (!models?.active || !models?.available) {
    return null;
  }

  const handleSelect = (category, key, value) => {
    if (!value || value === models.active[key]) {
      return;
    }
    onChange({ [key]: value });
  };

  const sections = [
    { key: 'textModel', label: 'Chat', options: models.available.text },
    { key: 'visionModel', label: 'Vision', options: models.available.vision },
    { key: 'imageModel', label: 'Image', options: models.available.image },
  ];

  return (
    <GlassCard className="fixed top-4 left-4 z-[60] p-3 w-[min(92vw,320px)]">
      <div className="flex items-center gap-2 mb-3 text-white">
        <Settings2 className="h-4 w-4" />
        <span className="text-sm font-medium">Models</span>
        {saving && <span className="text-xs text-white/60">Saving...</span>}
      </div>

      <div className="space-y-3">
        {sections.map(({ key, label, options }) => (
          <label key={key} className="block">
            <span className="text-xs uppercase tracking-wide text-white/60">{label}</span>
            <select
              className="mt-1 w-full rounded-md border border-white/20 bg-black/30 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              value={models.active[key]}
              disabled={saving}
              onChange={(event) => handleSelect(label.toLowerCase(), key, event.target.value)}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id} className="text-black">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      )}
    </GlassCard>
  );
};

ModelSelector.propTypes = {
  models: PropTypes.shape({
    active: PropTypes.object,
    available: PropTypes.object,
  }),
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default ModelSelector;
