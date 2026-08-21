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
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tabs: WorkspaceTab[];
  defaultTabId?: string;
  actions?: React.ReactNode;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  title,
  subtitle,
  icon: TitleIcon,
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
    <div className="space-y-6">
      {/* Workspace Header & Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            {TitleIcon && (
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                <TitleIcon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>

        {/* Horizontal Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-blue-800'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
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
      </div>

      {/* Workspace Active Tab Body */}
      <div className="transition-all duration-200">
        {activeTabObj?.component}
      </div>
    </div>
  );
};
