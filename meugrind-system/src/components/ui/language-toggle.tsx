'use client';

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface LanguageToggleProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageToggle({ variant = 'default', className = '' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={toggleLanguage}
        className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors hover:bg-white/10 ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase font-bold">
          {language === 'pt' ? 'PT' : 'EN'}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`relative inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1 ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <motion.button
        onClick={() => language !== 'pt' && toggleLanguage()}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
          language === 'pt'
            ? 'bg-white text-slate-900 shadow-lg'
            : 'text-white/70 hover:text-white'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        PT
      </motion.button>
      <motion.button
        onClick={() => language !== 'en' && toggleLanguage()}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-lg'
            : 'text-white/70 hover:text-white'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        EN
      </motion.button>
    </motion.div>
  );
}