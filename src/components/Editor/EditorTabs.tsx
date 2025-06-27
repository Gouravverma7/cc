import React from 'react';
import { X } from 'lucide-react';
import { Tab } from '../../types';

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  isDarkTheme: boolean;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  isDarkTheme
}) => {
  if (tabs.length === 0) return null;

  return (
    <div className={`flex border-b overflow-x-auto ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-100 border-gray-200'
    }`}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center space-x-2 px-4 py-2 border-r cursor-pointer group min-w-0 ${
            isDarkTheme ? 'border-gray-700' : 'border-gray-200'
          } ${
            activeTabId === tab.id
              ? isDarkTheme
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-900'
              : isDarkTheme
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="truncate text-sm">
            {tab.name}
            {tab.isDirty && <span className="text-orange-400 ml-1">•</span>}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
              isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};