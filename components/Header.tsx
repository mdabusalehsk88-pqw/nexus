
import React from 'react';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const getTitle = () => {
    switch(activeTab) {
      case AppTab.CHAT: return 'AI Workspace';
      case AppTab.LIVE: return 'Live Studio';
      case AppTab.IMAGES: return 'Visual Forge';
      case AppTab.VIDEOS: return 'Cinema Lab';
      case AppTab.GALLERY: return 'Vault';
      default: return 'Nexus';
    }
  };

  const getSub = () => {
    switch(activeTab) {
      case AppTab.CHAT: return 'Powered by Gemini 3 Pro';
      case AppTab.LIVE: return 'Real-time Multimodal Interaction';
      case AppTab.IMAGES: return 'Gemini 2.5 Flash Image';
      case AppTab.VIDEOS: return 'Powered by Google Veo';
      case AppTab.GALLERY: return 'All your creations in one place';
      default: return 'Multimodal AI Studio';
    }
  };

  return (
    <header className="h-20 border-b border-gray-800/50 flex items-center justify-between px-8 bg-gray-950/20 backdrop-blur-md sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold font-outfit tracking-tight">{getTitle()}</h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{getSub()}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">API Live</span>
        </div>
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
