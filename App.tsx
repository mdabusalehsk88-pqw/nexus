
import React, { useState } from 'react';
import { AppTab, ChatMessage, GeneratedAsset } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import LiveStudio from './components/LiveStudio';
import Gallery from './components/Gallery';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [gallery, setGallery] = useState<GeneratedAsset[]>([]);

  const addToGallery = (asset: GeneratedAsset) => {
    setGallery(prev => [asset, ...prev]);
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 overflow-hidden font-sans text-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header activeTab={activeTab} />
        
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
          {activeTab === AppTab.CHAT && (
            <ChatInterface history={history} setHistory={setHistory} />
          )}
          {activeTab === AppTab.LIVE && (
            <LiveStudio />
          )}
          {activeTab === AppTab.IMAGES && (
            <ImageGenerator onGenerated={(url, prompt) => addToGallery({
              id: Date.now().toString(),
              type: 'image',
              url,
              prompt,
              timestamp: Date.now()
            })} />
          )}
          {activeTab === AppTab.VIDEOS && (
            <VideoGenerator onGenerated={(url, prompt) => addToGallery({
              id: Date.now().toString(),
              type: 'video',
              url,
              prompt,
              timestamp: Date.now()
            })} />
          )}
          {activeTab === AppTab.GALLERY && (
            <Gallery items={gallery} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
