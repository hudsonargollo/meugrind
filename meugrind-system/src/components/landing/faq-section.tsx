'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What makes MEUGRIND different from other productivity tools?',
    answer: 'MEUGRIND is specifically designed for multi-hyphenate creatives who manage multiple ventures. Unlike generic productivity tools, we provide specialized modules for band management, influencer campaigns, solar business, PR events, and personal projects—all with offline-first architecture and privacy controls.',
  },
  {
    question: 'How does the offline-first approach work?',
    answer: 'MEUGRIND works completely offline by storing all your data locally on your device. When you&rsquo;re back online, it automatically syncs your changes across all devices using conflict-free collaborative editing. You never lose productivity, even without internet.',
  },
  {
    question: 'Can I keep my different contexts separate?',
    answer: 'Absolutely! Our Privacy Shield feature lets you control what information is visible in each context. You can keep your personal projects completely separate from your business ventures while still managing everything from one unified system.',
  },
  {
    question: 'Is there a free plan available?',
    answer: 'Yes! MEUGRIND offers a generous free plan that includes core productivity features, offline functionality, and basic sync across devices. Premium plans unlock advanced features like unlimited contexts, team collaboration, and priority support.',
  },
  {
    question: 'How secure is my data?',
    answer: 'Your data security is our top priority. We use end-to-end encryption, are SOC 2 compliant, GDPR ready, and maintain a 99.9% uptime SLA. Your data is stored locally first, giving you complete control over your information.',
  },
  {
    question: 'Can I collaborate with team members?',
    answer: 'Yes! MEUGRIND supports collaborative workflows with granular permission controls. You can share specific projects or contexts with team members while maintaining privacy for other areas of your work.',
  },
  {
    question: 'What devices and platforms are supported?',
    answer: 'MEUGRIND works on all modern web browsers and is designed as a Progressive Web App (PWA), so it works seamlessly on desktop, tablet, and mobile devices. Native apps for iOS and Android are coming soon.',
  },
  {
    question: 'How do I migrate my existing data?',
    answer: 'We provide import tools for popular productivity platforms and project management tools. Our onboarding process includes guided data migration, and our support team is available to help with complex migrations.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
            Frequently Asked
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
              Questions
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Everything you need to know about MEUGRIND and how it can transform your creative workflow
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
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you get the most out of MEUGRIND
          </p>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('mailto:support@meugrind.com', '_blank')}
          >
            Contact Support
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}