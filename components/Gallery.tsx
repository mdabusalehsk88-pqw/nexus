
import React from 'react';
import { GeneratedAsset } from '../types';

interface GalleryProps {
  items: GeneratedAsset[];
}

const Gallery: React.FC<GalleryProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center opacity-40 px-6">
        <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
          <i className="fas fa-archive text-3xl"></i>
        </div>
        <h2 className="text-xl font-bold mb-2">No Artifacts Found</h2>
        <p className="text-sm max-w-xs">Start creating images or videos to build your personal vault of AI-generated content.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div key={item.id} className="group relative bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="aspect-square bg-black flex items-center justify-center overflow-hidden">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
              )}
            </div>
            
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  item.type === 'image' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {item.type}
                </span>
                <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{item.prompt}</p>
            </div>

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <a 
                href={item.url} 
                download={`nexus-${item.type}-${item.id}`}
                className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                <i className="fas fa-download"></i>
              </a>
              <button 
                onClick={() => {
                   if (navigator.share) {
                     navigator.share({ title: 'Nexus Creation', text: item.prompt, url: item.url });
                   } else {
                     navigator.clipboard.writeText(item.url);
                     alert('URL copied to clipboard!');
                   }
                }}
                className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                <i className="fas fa-share-alt"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
