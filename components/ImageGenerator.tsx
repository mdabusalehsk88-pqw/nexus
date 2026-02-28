
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

interface ImageGeneratorProps {
  onGenerated: (url: string, prompt: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const url = await generateImage(prompt, aspectRatio);
      setResult(url);
      onGenerated(url, prompt);
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please try a different prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-gray-500">The Blueprint</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision in detail... e.g. 'A futuristic cyberpunk city with neon lighting, cinematic fog, 8k resolution'"
              className="w-full h-48 bg-gray-900 border border-gray-800 rounded-2xl p-6 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Aspect Ratio</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                    aspectRatio === ratio 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : <i className="fas fa-wand-magic-sparkles text-xl"></i>}
            {loading ? 'Synthesizing Visuals...' : 'Generate Artifact'}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-900/40 rounded-3xl border border-gray-800 border-dashed relative min-h-[400px] group overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-bolt text-indigo-500"></i>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium animate-pulse">Forging pixels...</p>
            </div>
          ) : result ? (
            <div className="w-full h-full relative group">
              <img src={result} alt="Generated" className="w-full h-full object-contain rounded-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = 'nexus-generation.png';
                    link.click();
                  }}
                  className="bg-white text-black p-4 rounded-full hover:scale-110 transition-transform"
                >
                  <i className="fas fa-download text-lg"></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 opacity-40">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-palette text-3xl"></i>
              </div>
              <h3 className="text-lg font-bold mb-2">Visual Canvas</h3>
              <p className="text-sm max-w-[240px] mx-auto">Input a prompt on the left to materialize your imagination into reality.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
