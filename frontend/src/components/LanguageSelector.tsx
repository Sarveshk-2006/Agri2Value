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
    if (lang.code === currentLangCode) return;
    await changeAppLanguage(lang.code);
    if (onLanguageChange) {
      onLanguageChange(lang.code);
    }
    // Reload to apply Google Translate neural DOM translation universally across all 100% of elements
    window.location.reload();
  };

  // Determine styling based on variant - matches dark pill in user screenshot
  const pillClasses = variant === 'dark'
    ? 'bg-[#181a20]/95 hover:bg-[#23272e] text-white border-slate-700/80 shadow-md'
    : variant === 'light'
    ? 'bg-white text-slate-800 hover:bg-slate-100 border-slate-200/80 shadow-xs'
    : 'bg-[#181a20]/95 hover:bg-[#23272e] text-white border-slate-700/80 shadow-md';

  return (
    <div className={`relative inline-block text-left notranslate ${className}`} ref={dropdownRef}>
      {/* Trigger Pill matching screenshot 1 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${pillClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Language"
        title="Select Language / भाषा निवडा"
      >
        <Globe className="w-3.5 h-3.5 shrink-0 text-white" />
        <span className="tracking-tight text-white">{currentLang.name}</span>
      </button>

      {/* Floating Dropdown matching user screenshot 2 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-36 rounded-lg bg-white shadow-2xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto notranslate"
          role="listbox"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLangCode;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang)}
                className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a73e8] text-white font-semibold'
                    : 'text-slate-800 hover:bg-slate-100 font-normal'
                }`}
              >
                <span>{lang.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

