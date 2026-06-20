import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ChevronDown } from 'lucide-react';
import { GlassCard } from './ui/Card';

function getActiveLabel(models, key) {
  const activeId = models?.active?.[key];
  if (!activeId) return null;
  const category = key.replace('Model', '');
  const options = models?.available?.[category] || [];
  return options.find((o) => o.id === activeId)?.label || activeId;
}

const ModelSelector = ({ models, loading, saving, error, onChange }) => {
  const [collapsed, setCollapsed] = useState(true);

  if (loading && !models) {
    return (
      <div className="w-full max-w-md mx-auto mb-3 px-3 sm:px-4">
        <GlassCard className="p-3 text-white/70 text-sm text-center">
          Loading models...
        </GlassCard>
      </div>
    );
  }

  if (!models?.active || !models?.available) {
    return null;
  }

  const handleSelect = (key, value) => {
    if (!value || value === models.active[key]) return;
    onChange({ [key]: value });
  };

  const sections = [
    { key: 'textModel', label: 'Chat', options: models.available.text },
    { key: 'visionModel', label: 'Vision', options: models.available.vision },
    { key: 'imageModel', label: 'Image', options: models.available.image },
  ];

  const chatLabel = getActiveLabel(models, 'textModel');
  const collapsedHint = chatLabel ? `Models · ${chatLabel}` : 'Models';

  return (
    <div className="w-full max-w-md mx-auto mb-3 px-3 sm:px-4 relative z-50">
      <GlassCard className="relative shadow-lg shadow-black/20 overflow-visible isolate">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 sm:px-4 py-2.5 text-white hover:bg-white/5 transition-colors rounded-xl"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls="model-selector-content"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {collapsed ? collapsedHint : 'Models'}
            </span>
            {saving && (
              <span className="text-xs text-white/60 font-normal shrink-0">Saving...</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${
              collapsed ? '' : 'rotate-180'
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              id="model-selector-content"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full mt-1 z-[60] rounded-xl border border-white/15 bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50"
            >
              <div className="px-3 sm:px-4 pb-4 pt-3 max-h-[min(50vh,320px)] overflow-y-auto">
                <div className="space-y-3">
                  {sections.map(({ key, label, options }) => (
                    <label key={key} className="block">
                      <span className="text-xs uppercase tracking-wide text-white/60">{label}</span>
                      <select
                        className="mt-1 w-full rounded-md border border-white/20 bg-black/30 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        value={models.active[key]}
                        disabled={saving}
                        onChange={(event) => handleSelect(key, event.target.value)}
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

                {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
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
