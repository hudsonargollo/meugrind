'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';

export function FAQSection() {
  const { translations } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: translations.faq.items.whatMakesDifferent.question,
      answer: translations.faq.items.whatMakesDifferent.answer,
    },
    {
      question: translations.faq.items.howOfflineWorks.question,
      answer: translations.faq.items.howOfflineWorks.answer,
    },
    {
      question: translations.faq.items.separateContexts.question,
      answer: translations.faq.items.separateContexts.answer,
    },
    {
      question: translations.faq.items.freePlan.question,
      answer: translations.faq.items.freePlan.answer,
    },
    {
      question: translations.faq.items.dataSecurity.question,
      answer: translations.faq.items.dataSecurity.answer,
    },
    {
      question: translations.faq.items.collaboration.question,
      answer: translations.faq.items.collaboration.answer,
    },
    {
      question: translations.faq.items.platforms.question,
      answer: translations.faq.items.platforms.answer,
    },
    {
      question: translations.faq.items.migration.question,
      answer: translations.faq.items.migration.answer,
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {translations.faq.title}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
              {translations.faq.subtitle}
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {translations.faq.description}
          </motion.p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <motion.button
                  className="w-full p-6 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                  onClick={() => toggleFAQ(index)}
                  whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.02)' }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.div>
                </motion.button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className="h-px bg-gradient-to-r from-purple-200 to-blue-200 mb-4" />
                    <p 
                      className="text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact support */}
        <motion.div
          className="text-center mt-16 p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {translations.faq.stillHaveQuestions}
          </h3>
          <p className="text-gray-600 mb-6">
            {translations.faq.contactSupportDescription}
          </p>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('mailto:support@meugrind.com', '_blank')}
          >
            {translations.faq.contactSupport}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}