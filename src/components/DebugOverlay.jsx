import React from 'react';

export default function DebugOverlay({ open, onClose, entries = [] }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/70 text-white" onClick={onClose}>
            <div className="absolute top-4 right-4"> <button className="px-3 py-1 bg-red-600 rounded" onClick={onClose}>Close</button> </div>
            <div className="absolute inset-0 p-4 overflow-auto">
                <h2 className="text-lg font-bold mb-2">Debug Overlay</h2>
                <div className="space-y-4">
                    {entries.length === 0 && <div className="opacity-70">No entries yet</div>}
                    {entries.map((e, i) => (
                        <div key={i} className="bg-gray-800/60 rounded p-3 border border-white/10">
                            <div className="text-xs opacity-70">{new Date(e.ts).toLocaleString()} • {e.label}</div>
                            <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-64 mt-2">{e.text}</pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


