import React from 'react';
import PropTypes from 'prop-types';
import { Settings2, Sparkles } from 'lucide-react';
import { GlassCard } from './ui/Card';

function slotValue(slot) {
  if (!slot?.provider || !slot?.model) return '';
  return `${slot.provider}:${slot.model}`;
}

function formatOptionLabel(option) {
  const provider = option.provider.charAt(0).toUpperCase() + option.provider.slice(1);
  return `${option.label} (${provider})`;
}

const ModelSelector = ({ config, loading, saving, error, onChange }) => {
  if (loading && !config) {
    return (
      <GlassCard className="fixed top-4 left-4 z-[60] p-3 text-white/70 text-sm">
        Loading config...
      </GlassCard>
    );
  }

  if (!config?.active || !config?.available) {
    return null;
  }

  const handleModelChange = (category, value) => {
    if (!value || value === slotValue(config.active[category])) {
      return;
    }
    onChange({ [category]: value });
  };

  const handlePersonalityChange = (personalityId) => {
    if (!personalityId || personalityId === config.active.personality) {
      return;
    }
    onChange({ personality: personalityId });
  };

  const modelSections = [
    { key: 'text', label: 'Chat', options: config.available.text || [] },
    { key: 'vision', label: 'Vision', options: config.available.vision || [] },
    { key: 'image', label: 'Image', options: config.available.image || [] },
  ];

  return (
    <GlassCard className="fixed top-4 left-4 z-[60] p-3 w-[min(92vw,340px)] max-h-[85vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 text-white">
        <Settings2 className="h-4 w-4" />
        <span className="text-sm font-medium">Agent Config</span>
        {saving && <span className="text-xs text-white/60">Saving...</span>}
      </div>

      <label className="block mb-3">
        <span className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Personality
        </span>
        <select
          className="mt-1 w-full rounded-md border border-white/20 bg-black/30 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          value={config.active.personality || 'default'}
          disabled={saving}
          onChange={(event) => handlePersonalityChange(event.target.value)}
        >
          {(config.personalities || []).map((p) => (
            <option key={p.id} value={p.id} className="text-black">
              {p.label}
            </option>
          ))}
        </select>
        {config.personalities?.find((p) => p.id === config.active.personality)?.description && (
          <p className="mt-1 text-xs text-white/50">
            {config.personalities.find((p) => p.id === config.active.personality).description}
          </p>
        )}
      </label>

      <div className="space-y-3">
        {modelSections.map(({ key, label, options }) => (
          <label key={key} className="block">
            <span className="text-xs uppercase tracking-wide text-white/60">{label}</span>
            <select
              className="mt-1 w-full rounded-md border border-white/20 bg-black/30 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              value={slotValue(config.active[key])}
              disabled={saving || options.length === 0}
              onChange={(event) => handleModelChange(key, event.target.value)}
            >
              {options.length === 0 ? (
                <option value="">No models — add API key</option>
              ) : (
                options.map((option) => (
                  <option
                    key={`${option.provider}:${option.model}`}
                    value={`${option.provider}:${option.model}`}
                    className="text-black"
                  >
                    {formatOptionLabel(option)}
                  </option>
                ))
              )}
            </select>
          </label>
        ))}
      </div>

      {config.configuredProviders && (
        <p className="mt-3 text-[10px] text-white/40 uppercase tracking-wide">
          Providers:{' '}
          {Object.entries(config.configuredProviders)
            .filter(([, ok]) => ok)
            .map(([name]) => name)
            .join(', ') || 'none'}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </GlassCard>
  );
};

ModelSelector.propTypes = {
  config: PropTypes.shape({
    active: PropTypes.object,
    available: PropTypes.object,
    personalities: PropTypes.array,
    configuredProviders: PropTypes.object,
  }),
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default ModelSelector;
