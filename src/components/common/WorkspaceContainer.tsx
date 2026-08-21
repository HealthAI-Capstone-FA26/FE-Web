import React from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface WorkspaceTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  component: React.ReactNode;
}

interface WorkspaceContainerProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  tabs: WorkspaceTab[];
  defaultTabId?: string;
  actions?: React.ReactNode;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  tabs,
  defaultTabId,
  actions
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');

  const initialTab = defaultTabId || tabs[0]?.id || '';
  const activeTabId = tabs.some(t => t.id === activeTabParam) ? activeTabParam! : initialTab;

  const handleTabChange = (tabId: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tabId);
      return newParams;
    });
  };

  const activeTabObj = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div className="space-y-4">
      {/* Floating Sub-Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-scrollbar">
        <div className="flex flex-wrap items-center gap-2 max-w-full no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 font-black shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:text-blue-900 shadow-2xs font-bold'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Workspace Active Tab Body */}
      <div className="transition-all duration-200">
        {activeTabObj?.component}
      </div>
    </div>
  );
};
