// frontend/src/components/LanguageSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, changeAppLanguage, type LanguageOption } from '../i18n';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  variant?: 'dark' | 'light' | 'auto';
  className?: string;
  onLanguageChange?: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'auto',
  className = '',
  onLanguageChange,
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangCode = i18n.language || 'en';
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = async (lang: LanguageOption) => {
    setIsOpen(false);
    await changeAppLanguage(lang.code);
    if (onLanguageChange) {
      onLanguageChange(lang.code);
    }
  };

  // Determine styling based on variant
  const pillClasses = variant === 'dark'
    ? 'bg-slate-900/90 text-white hover:bg-slate-800 border-slate-700/80 shadow-md'
    : variant === 'light'
    ? 'bg-white text-slate-800 hover:bg-slate-100 border-slate-200/80 shadow-xs'
    : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/60 shadow-xs';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Pill matching screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${pillClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Language"
        title="Select Language / भाषा निवडा"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="tracking-tight">{currentLang.name}</span>
      </button>

      {/* Floating Dropdown matching Image 2 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-2xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto"
          role="listbox"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>Select Language</span>
            <span className="text-[9px] text-emerald-600 font-mono">10 Languages</span>
          </div>

          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLangCode;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lang.name}</span>
                  {lang.code !== 'en' && (
                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      ({lang.englishName})
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
