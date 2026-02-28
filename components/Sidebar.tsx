
import React from 'react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: AppTab.CHAT, icon: 'fa-comments', label: 'AI Workspace' },
    { id: AppTab.LIVE, icon: 'fa-microphone-lines', label: 'Live Studio' },
    { id: AppTab.IMAGES, icon: 'fa-wand-magic-sparkles', label: 'Visual Forge' },
    { id: AppTab.VIDEOS, icon: 'fa-film', label: 'Cinema Lab' },
    { id: AppTab.GALLERY, icon: 'fa-images', label: 'Vault' },
  ];

  return (
    <aside className="w-20 md:w-64 border-r border-gray-800 flex flex-col items-center md:items-stretch bg-gray-950/50 backdrop-blur-xl z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i className="fas fa-bolt text-white text-xl"></i>
        </div>
        <span className="hidden md:block font-outfit text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          NEXUS
        </span>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeTab === tab.id
                ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/50'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <i className={`fas ${tab.icon} text-lg ${activeTab === tab.id ? 'text-indigo-400' : 'group-hover:scale-110 transition-transform'}`}></i>
            <span className="hidden md:block font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <img src="https://picsum.photos/40/40" alt="Avatar" className="w-8 h-8 rounded-full border border-gray-700" />
          <div className="hidden md:block">
            <p className="text-xs font-semibold">Senior Engineer</p>
            <p className="text-[10px] text-gray-500">Pro Plan Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
