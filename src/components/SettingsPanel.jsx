import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Sparkles, ChevronDown, Globe, Wrench } from 'lucide-react';
import { GlassCard } from './ui/Card';

function slotValue(slot) {
  if (!slot?.provider || !slot?.model) return '';
  return `${slot.provider}:${slot.model}`;
}

function formatOptionLabel(option) {
  const provider = option.provider.charAt(0).toUpperCase() + option.provider.slice(1);
  const apiHint = option.api === 'responses' ? ' · Responses' : '';
  return `${option.label} (${provider})${apiHint}`;
}

function getSlotLabel(config, key) {
  const slot = config?.active?.[key];
  if (!slot) return null;
  const options = config?.available?.[key] || [];
  const match = options.find(
    (o) => o.provider === slot.provider && o.model === slot.model
  );
  return match?.label || slot.model;
}

const selectClass =
  'mt-1 w-full rounded-md border border-white/20 bg-black/30 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50';

const sectionLabelClass = 'text-xs uppercase tracking-wide text-white/60';

const SettingsPanel = ({ config, loading, saving, error, onChange }) => {
  const [collapsed, setCollapsed] = useState(true);

  if (loading && !config) {
    return (
      <div className="w-full max-w-md mx-auto mb-3 px-3 sm:px-4">
        <GlassCard className="p-3 text-white/70 text-sm text-center">
          Loading settings...
        </GlassCard>
      </div>
    );
  }

  if (!config?.active || !config?.available) {
    return null;
  }

  const handleModelChange = (category, value) => {
    if (!value || value === slotValue(config.active[category])) return;
    onChange({ [category]: value });
  };

  const handlePersonalityChange = (personalityId) => {
    if (!personalityId || personalityId === config.active.personality) return;
    onChange({ personality: personalityId });
  };

  const handleSearchProviderChange = (searchProvider) => {
    if (!searchProvider || searchProvider === config.active.searchProvider) return;
    onChange({ searchProvider });
  };

  const modelSections = [
    { key: 'text', label: 'Chat', options: config.available.text || [] },
    { key: 'vision', label: 'Vision', options: config.available.vision || [] },
    { key: 'image', label: 'Image', options: config.available.image || [] },
  ];

  const searchOptions = (config.searchProviders || []).filter((p) => p.configured);
  const activePersonality = config.personalities?.find((p) => p.id === config.active.personality);
  const activeSearch = config.searchProviders?.find((p) => p.id === config.active.searchProvider);

  const chatLabel = getSlotLabel(config, 'text');
  const collapsedHint = [activePersonality?.label, chatLabel].filter(Boolean).join(' · ');

  return (
    <div className="w-full max-w-md mx-auto mb-3 px-3 sm:px-4 relative z-50">
      <GlassCard className="relative shadow-lg shadow-black/20 overflow-visible isolate">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 sm:px-4 py-2.5 text-white hover:bg-white/5 transition-colors rounded-xl"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls="settings-panel-content"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {collapsed ? (collapsedHint || 'Settings') : 'Settings'}
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
              id="settings-panel-content"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full mt-1 z-[60] rounded-xl border border-white/15 bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50"
            >
              <div className="px-3 sm:px-4 pb-4 pt-3 max-h-[min(50vh,420px)] overflow-y-auto">
                <label className="block mb-4 mt-2">
                  <span className={`${sectionLabelClass} flex items-center gap-1`}>
                    <Sparkles className="h-3 w-3" /> Personality
                  </span>
                  <select
                    className={`${selectClass} focus:ring-purple-400/50`}
                    value={config.active.personality || 'default'}
                    disabled={saving}
                    onChange={(e) => handlePersonalityChange(e.target.value)}
                  >
                    {(config.personalities || []).map((p) => (
                      <option key={p.id} value={p.id} className="text-black">
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {activePersonality?.description && (
                    <p className="mt-1 text-xs text-white/50">{activePersonality.description}</p>
                  )}
                </label>

                <p className={`${sectionLabelClass} mb-2`}>Models</p>
                <div className="space-y-3 mb-4">
                  {modelSections.map(({ key, label, options }) => (
                    <label key={key} className="block">
                      <span className={sectionLabelClass}>{label}</span>
                      <select
                        className={selectClass}
                        value={slotValue(config.active[key])}
                        disabled={saving || options.length === 0}
                        onChange={(e) => handleModelChange(key, e.target.value)}
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

                <p className={`${sectionLabelClass} mb-2 flex items-center gap-1`}>
                  <Globe className="h-3 w-3" /> Web search
                </p>
                <label className="block mb-4">
                  <select
                    className={selectClass}
                    value={config.active.searchProvider || 'brave'}
                    disabled={saving || searchOptions.length === 0}
                    onChange={(e) => handleSearchProviderChange(e.target.value)}
                  >
                    {searchOptions.length === 0 ? (
                      <option value="">No search API — add BRAVE_API_KEY or PERPLEXITY_API_KEY</option>
                    ) : (
                      searchOptions.map((p) => (
                        <option key={p.id} value={p.id} className="text-black">
                          {p.label}
                        </option>
                      ))
                    )}
                  </select>
                  {activeSearch?.description && (
                    <p className="mt-1 text-xs text-white/50">{activeSearch.description}</p>
                  )}
                </label>

                {config.toolSources && (
                  <>
                    <p className={`${sectionLabelClass} mb-2 flex items-center gap-1`}>
                      <Wrench className="h-3 w-3" /> Tool APIs (env keys)
                    </p>
                    <ul className="text-xs text-white/50 space-y-1 mb-3">
                      <li>Weather: {config.toolSources.weather ? '✓ configured' : '○ weatherAPIKey'}</li>
                      <li>News: {config.toolSources.news ? '✓ NewsData.io' : '○ newsAPIKey'}</li>
                      <li>Streaming: {config.toolSources.shows ? '✓ RapidAPI' : '○ showsAPIKey'}</li>
                    </ul>
                  </>
                )}

                {config.configuredProviders && (
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">
                    LLM providers:{' '}
                    {Object.entries(config.configuredProviders)
                      .filter(([, ok]) => ok)
                      .map(([name]) => name)
                      .join(', ') || 'none'}
                  </p>
                )}

                {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};

SettingsPanel.propTypes = {
  config: PropTypes.shape({
    active: PropTypes.object,
    available: PropTypes.object,
    personalities: PropTypes.array,
    searchProviders: PropTypes.array,
    toolSources: PropTypes.object,
    configuredProviders: PropTypes.object,
  }),
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default SettingsPanel;
