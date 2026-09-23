import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCw, type LucideIcon } from 'lucide-react';

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

  // Quản lý các tab đã từng được mở (Lazy Mount + Keep-Alive)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([activeTabId]));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (activeTabId) {
      setVisitedTabs(prev => {
        if (prev.has(activeTabId)) return prev;
        const next = new Set(prev);
        next.add(activeTabId);
        return next;
      });
    }
  }, [activeTabId]);

  // Pre-mount tất cả các tab còn lại ngầm sau 50ms để khi người dùng click sang tab bất kỳ đều hiển thị tức thì 0ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisitedTabs(new Set(tabs.map(t => t.id)));
    }, 50);
    return () => clearTimeout(timer);
  }, [tabs]);

  const handleTabChange = (tabId: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tabId);
      return newParams;
    });
  };

  const handleTriggerRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('workspace-refresh'));
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

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

        {/* Right Actions: Nút Làm mới dữ liệu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-teal-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-2xs transition cursor-pointer disabled:opacity-60"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RotateCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          {actions}
        </div>
      </div>

      {/* Workspace Active Tab Body with Keep-Alive (Không unmount khi đổi tab) */}
      <div className="transition-all duration-200">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isVisited = visitedTabs.has(tab.id);

          // Lazy load: chỉ mount khi tab được truy cập lần đầu, sau đó duy trì trong DOM
          if (!isVisited) return null;

          return (
            <div
              key={tab.id}
              className={isActive ? 'block animate-in fade-in duration-150' : 'hidden'}
            >
              {tab.component}
            </div>
          );
        })}
      </div>
    </div>
  );
};
