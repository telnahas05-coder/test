import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Wand2, 
  ShoppingBag, 
  MessageSquare, 
  Image as ImageIcon, 
  ArrowLeft, 
  Loader2,
  RefreshCw,
  Download,
  Palette,
  Trees,
  Waves,
  Camera,
  Building2,
  Sun,
  Snowflake,
  Gem,
  Sparkles,
  Trash2,
  Baby,
  Smile,
  Briefcase,
  Clock,
  IdCard
} from 'lucide-react';
import { BackgroundTheme, Message } from './types';
import { processPhoto, chatWithSearch } from './services/geminiService';
import BeforeAfterSlider from './components/BeforeAfterSlider';

const THEMES: {id: BackgroundTheme, label: string, icon: React.ElementType}[] = [
  { id: 'Restore & Colorize', label: 'ترمیم و رنگی‌سازی', icon: Palette },
  { id: 'Passport Photo', label: 'عکس پرسنلی / پاسپورت', icon: IdCard },
  { id: 'AI Smart Edit', label: 'انتخاب هوشمند', icon: Sparkles },
  
  // Age Transformations
  { id: 'Age: Child', label: 'تبدیل به کودک', icon: Baby },
  { id: 'Age: Young', label: 'جوان‌سازی', icon: Smile },
  { id: 'Age: Middle-aged', label: 'میانسالی', icon: Briefcase },
  { id: 'Age: Old', label: 'پیری / سالمندی', icon: Clock },

  // Backgrounds
  { id: 'Studio Lighting', label: 'نورپردازی آتلیه', icon: Camera },
  { id: 'Urban/City', label: 'شهری / خیابان', icon: Building2 },
  { id: 'Nature', label: 'طبیعت', icon: Trees },
  { id: 'Sunset', label: 'غروب آفتاب', icon: Sun },
  { id: 'River Side', label: 'کنار رودخانه', icon: Waves },
  { id: 'Winter/Snow', label: 'زمستان / برفی', icon: Snowflake },
  { id: 'Ocean/Beach', label: 'اقیانوس / ساحل', icon: Waves },
  { id: 'Luxury Interior', label: 'دکوراسیون لوکس', icon: Gem },
  { id: 'Forest', label: 'جنگل', icon: Trees },
  { id: 'Fantasy', label: 'فانتزی / رویایی', icon: Sparkles },
];

// Helper to convert file to base64 (strip prefix)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix for API
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  // State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<BackgroundTheme>('Restore & Colorize');
  const [activeTab, setActiveTab] = useState<'design' | 'chat'>('design');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setOriginalImage(base64);
        setGeneratedImage(null); // Reset generation on new upload
        setChatHistory([]); // Clear chat on new upload
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setChatHistory([]);
  };

  const handleGenerate = async (themeOverride?: BackgroundTheme) => {
    if (!originalImage) return;
    
    const themeToUse = themeOverride || selectedTheme;
    // Map theme ID back to Persian label for display
    const themeObj = THEMES.find(t => t.id === themeToUse);
    const themeLabel = themeObj ? themeObj.label : themeToUse;

    setIsLoading(true);
    
    try {
        if (themeToUse === 'Restore & Colorize') {
            setLoadingMessage("در حال ترمیم، شفاف‌سازی و رنگی‌سازی تصویر...");
        } else if (themeToUse === 'Passport Photo') {
            setLoadingMessage("در حال استانداردسازی برای عکس پرسنلی (حذف پس‌زمینه، تنظیم نور)...");
        } else if (themeToUse === 'AI Smart Edit') {
            setLoadingMessage("هوش مصنوعی در حال آنالیز تصویر برای بهترین نتیجه...");
        } else if (themeToUse.startsWith('Age:')) {
            setLoadingMessage(`در حال پردازش تغییر سن به وضعیت: ${themeLabel}...`);
        } else {
            setLoadingMessage(`در حال انتقال سوژه به محیط ${themeLabel}...`);
        }

        const result = await processPhoto(originalImage, "", themeToUse);
        setGeneratedImage(result);
        
        let message = "";
        if (themeToUse === 'Restore & Colorize') {
             message = "تصویر شما ترمیم شد. خط و خش‌ها را حذف کردم و رنگ‌ها را اصلاح نمودم.";
        } else if (themeToUse === 'Passport Photo') {
             message = "عکس پرسنلی استاندارد آماده شد. پس‌زمینه سفید و نورپردازی اصلاح گردید.";
        } else if (themeToUse === 'AI Smart Edit') {
             message = "آنالیز انجام شد و بهترین تنظیمات و ترمیم طبیعی روی عکس اعمال گردید. چطور شد؟";
        } else if (themeToUse.startsWith('Age:')) {
             message = `تغییر سن انجام شد (${themeLabel}). سعی کردم شباهت چهره کاملا حفظ شود.`;
        } else {
             message = `این هم تصویر شما با پس‌زمینه جدید: ${themeLabel}.`;
        }
            
        addSystemMessage(message);
    } catch (error) {
      console.error(error);
      addSystemMessage("متاسفانه در پردازش تصویر مشکلی پیش آمد. لطفا دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: Message = { role: 'user', text: chatInput, type: 'text' };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsLoading(true);

    // Heuristic for intent detection
    const lowerInput = userMsg.text.toLowerCase();
    
    // Keywords indicating a general query
    const shoppingKeywords = ['buy', 'shop', 'price', 'where', 'cost', 'history', 'year', 'خرید', 'تاریخ', 'فروشگاه', 'کجا', 'قیمت'];
    const isSearch = shoppingKeywords.some(k => lowerInput.includes(k));
    
    // Keywords indicating a visual edit/restoration request
    const visualKeywords = [
        'change', 'add', 'remove', 'make', 'background', 'color', 'restore', 'fix', 'repair', 'scratch', 'blur', 'old', 'young', 'child', 'passport',
        'حذف', 'اضافه', 'تغییر', 'رنگ', 'ترمیم', 'واضح', 'پس زمینه', 'بک گراند', 'بازسازی', 'دریا', 'جنگل', 'لباس', 'پیر', 'جوان', 'کودک', 'بچه', 'پاسپورت', 'پرسنلی'
    ];
    const isVisualEdit = visualKeywords.some(k => lowerInput.includes(k)) && !isSearch;

    try {
      if (isVisualEdit && (originalImage || generatedImage)) {
         setLoadingMessage("در حال ویرایش تصویر طبق خواسته شما...");
         
         // Use generated image if available to allow iterative edits
         const base = generatedImage || originalImage || ""; 
         
         // Pass prompt directly to service
         const result = await processPhoto(base, userMsg.text);
         
         setGeneratedImage(result);
         addSystemMessage("تغییرات انجام شد. چطور به نظر می‌رسد؟");
      } else {
         // Chat/Search
         setLoadingMessage("در حال فکر کردن...");
         const contextImage = generatedImage || originalImage || undefined;
         const response = await chatWithSearch(userMsg.text, contextImage);
         
         const aiMsg: Message = {
           role: 'model',
           text: response.text,
           type: 'grounding',
           sources: response.sources
         };
         setChatHistory(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      addSystemMessage("متاسفانه مشکلی پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  const addSystemMessage = (text: string) => {
    setChatHistory(prev => [...prev, { role: 'model', text, type: 'text' }]);
  };

  const handleDownload = () => {
      if(generatedImage) {
          const link = document.createElement('a');
          link.href = `data:image/jpeg;base64,${generatedImage}`;
          link.download = 'restored-photo.jpg';
          link.click();
      }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 font-vazir overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 z-30 relative shadow-sm md:shadow-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Wand2 size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">ترمیم رویایی</h1>
        </div>
        <div className="hidden md:flex items-center text-sm text-gray-500 gap-4" dir="ltr">
             <span className="flex items-center gap-1">Gemini 2.5 Flash <ImageIcon size={14}/></span>
             <span className="flex items-center gap-1">Interactive Chat <MessageSquare size={14}/></span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Visual Canvas */}
        {/* Responsive Logic:
            - Mobile: Order 1 (Top). Fixed height (45dvh usually, 25dvh when chatting).
            - Desktop: Order 1 (RTL Right). Flex-1 (Takes remaining width).
        */}
        <div className={`relative bg-zinc-100 flex items-center justify-center overflow-hidden transition-[height] duration-300 ease-in-out
            order-1 md:order-1
            ${activeTab === 'chat' ? 'h-[25dvh] md:h-auto md:flex-1' : 'h-[45dvh] md:h-auto md:flex-1'}
        `}>
          {!originalImage ? (
            <div className="text-center p-4 md:p-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm">
                <ImageIcon className="text-gray-400" size={32} />
              </div>
              <h2 className="text-lg md:text-2xl font-semibold text-gray-800 mb-2">آپلود تصویر قدیمی</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed text-xs md:text-base">
                تصاویر قدیمی، آسیب‌دیده یا سیاه و سفید خود را آپلود کنید. <br className="hidden md:inline"/>
                ما آنها را ترمیم می‌کنیم.
              </p>
              <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 md:px-6 md:py-3 rounded-full font-medium cursor-pointer transition-colors shadow-lg hover:shadow-xl text-sm md:text-base">
                <Upload size={18} />
                <span>انتخاب تصویر</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col">
              <div className="flex-1 relative w-full h-full bg-zinc-900">
                 {generatedImage ? (
                    <BeforeAfterSlider beforeImage={originalImage} afterImage={generatedImage} />
                 ) : (
                    <img 
                      src={`data:image/jpeg;base64,${originalImage}`} 
                      className="w-full h-full object-contain" 
                      alt="Original" 
                    />
                 )}
                 
                 {/* Floating Action Buttons for Canvas */}
                 <div className="absolute top-4 left-4 flex gap-2" dir="ltr">
                    <label className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg backdrop-blur-sm cursor-pointer tooltip" title="تصویر جدید">
                        <RefreshCw size={20}/>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {generatedImage && (
                        <button onClick={handleDownload} className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg backdrop-blur-sm" title="دانلود">
                            <Download size={20}/>
                        </button>
                    )}
                 </div>
              </div>
            </div>
          )}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-4 text-center">
              <Loader2 className="animate-spin mb-4 text-indigo-400" size={32} />
              <p className="text-sm md:text-lg font-medium animate-pulse">{loadingMessage}</p>
            </div>
          )}
        </div>

        {/* Controls & Chat Container */}
        {/* Responsive Logic:
            - Mobile: Order 2 (Bottom). Flex-1 (Takes remaining height).
            - Desktop: Order 2 (RTL Left). Fixed Width (w-96).
        */}
        <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-col shadow-xl z-20 order-2 md:order-2 flex-1 md:flex-none md:h-full overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0">
                <button 
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-3 md:py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'design' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Wand2 size={16}/> ترمیم و طراحی
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 md:py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <MessageSquare size={16}/> دستیار هوشمند
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 relative">
                {activeTab === 'design' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
                        
                        {/* AI Magic Button */}
                        <button
                           disabled={!originalImage || isLoading}
                           onClick={() => handleGenerate('AI Smart Edit')}
                           className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white p-3 md:p-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                        >
                           <Sparkles size={20} className="text-yellow-200" fill="currentColor" />
                           <span className="font-semibold text-base md:text-lg">✨ انتخاب هوشمند هوش مصنوعی</span>
                        </button>

                        {/* Style Selector */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">حالت‌های ویرایش و پس‌زمینه</h3>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                {THEMES.filter(t => t.id !== 'AI Smart Edit').map(theme => {
                                    const Icon = theme.icon;
                                    const isAge = theme.id.toString().startsWith('Age:');
                                    const isPassport = theme.id === 'Passport Photo';
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => setSelectedTheme(theme.id)}
                                            className={`p-2 md:p-3 rounded-lg text-xs md:text-sm font-medium flex flex-col items-center gap-2 text-center transition-all border ${
                                                selectedTheme === theme.id 
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' 
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                            } ${isAge ? 'bg-orange-50/50' : ''} ${isPassport ? 'col-span-2 bg-blue-50/50 border-blue-200' : ''}`}
                                        >
                                            <Icon size={18} className={isAge ? 'text-orange-600' : isPassport ? 'text-blue-600' : ''} />
                                            <span>{theme.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                             <button 
                                disabled={!originalImage || isLoading}
                                onClick={() => handleGenerate()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold shadow transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18}/>}
                                {selectedTheme === 'Restore & Colorize' ? 'اجرای عملیات ترمیم' : 'اعمال تغییرات'}
                            </button>
                            
                            {originalImage && (
                                <button 
                                    onClick={handleReset}
                                    className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Trash2 size={16} />
                                    شروع مجدد / تصویر جدید
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 pb-4">
                            {chatHistory.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    <MessageSquare className="mx-auto mb-3 opacity-20" size={48} />
                                    <p className="text-sm">
                                        می‌توانید به من دستور دهید. <br/>
                                        مثلا: «خط و خش‌ها را پاک کن» یا «جوانش کن»
                                    </p>
                                </div>
                            )}
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-bl-none' 
                                        : 'bg-gray-100 text-gray-800 rounded-br-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200/50">
                                                <p className="text-xs font-semibold opacity-70 mb-2 flex items-center gap-1">
                                                    <ShoppingBag size={10}/> منابع مرتبط
                                                </p>
                                                <ul className="space-y-1">
                                                    {msg.sources.slice(0, 3).map((source, sIdx) => (
                                                        <li key={sIdx}>
                                                            <a 
                                                                href={source.uri} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-xs underline decoration-indigo-300 hover:text-indigo-600 truncate block text-left"
                                                                dir="ltr"
                                                            >
                                                                {source.title}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        
                        {/* Chat Input Area */}
                        <div className="mt-auto pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                            <div className="relative flex items-center">
                                <input 
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                    placeholder="دستور خود را بنویسید..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full pr-4 pl-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                    dir="auto"
                                />
                                <button 
                                    onClick={handleChatSubmit}
                                    disabled={!chatInput.trim() || isLoading}
                                    className="absolute left-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors rotate-180"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                                هوش مصنوعی ممکن است اشتباه کند. لطفا بررسی کنید.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}