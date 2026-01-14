'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Menu, X, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';

interface NavigationProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function Navigation({ onGetStarted, onSignIn }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const { translations } = useLanguage();
  
  const navItems = [
    { label: translations.nav.features, href: '#features' },
    { label: translations.nav.testimonials, href: '#testimonials' },
    { label: translations.nav.pricing, href: '#pricing' },
    { label: translations.nav.faq, href: '#faq' },
  ];
  
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.95)']
  );
  
  const backdropBlur = useTransform(
    scrollY,
    [0, 100],
    ['blur(0px)', 'blur(20px)']
  );

  const borderOpacity = useTransform(
    scrollY,
    [0, 100],
    [0, 0.2]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 mt-10"
        style={{
          backgroundColor,
          backdropFilter: backdropBlur,
        }}
      >
        <motion.div
          className="border-b"
          style={{
            borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MEUGRIND</span>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <motion.button
                    key={item.label}
                    onClick={() => scrollToSection(item.href)}
                    className="text-white/80 hover:text-white transition-colors font-medium"
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Desktop CTA Buttons and Language Toggle */}
              <div className="hidden md:flex items-center space-x-4">
                <LanguageToggle variant="compact" className="text-white" />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onSignIn}
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                  >
                    {translations.nav.signIn}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onGetStarted}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                  >
                    {translations.nav.getStarted}
                  </Button>
                </motion.div>
              </div>

              {/* Mobile menu button */}
              <motion.button
                className="md:hidden text-white p-2"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.95 }}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <motion.div
        className="fixed inset-0 z-40 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-lg" />
        
        <motion.div
          className="relative z-50 flex flex-col items-center justify-center h-full space-y-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: isOpen ? 0 : -50, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {navItems.map((item, index) => (
            <motion.button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="text-2xl font-semibold text-white hover:text-purple-400 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isOpen ? 1 : 0, 
                y: isOpen ? 0 : 20 
              }}
              transition={{ 
                duration: 0.3, 
                delay: isOpen ? 0.2 + index * 0.1 : 0 
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
            </motion.button>
          ))}
          
          <motion.div
            className="flex flex-col space-y-4 pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isOpen ? 1 : 0, 
              y: isOpen ? 0 : 20 
            }}
            transition={{ 
              duration: 0.3, 
              delay: isOpen ? 0.6 : 0 
            }}
          >
            <div className="flex justify-center mb-4">
              <LanguageToggle />
            </div>
            <Button
              onClick={() => {
                onSignIn();
                setIsOpen(false);
              }}
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
            >
              {translations.nav.signIn}
            </Button>
            <Button
              onClick={() => {
                onGetStarted();
                setIsOpen(false);
              }}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
            >
              {translations.nav.getStarted}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative"
        >
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full w-16 h-16 shadow-2xl border-0"
          >
            <Zap className="w-6 h-6" />
          </Button>
          
          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full -z-10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
    </>
  );
}