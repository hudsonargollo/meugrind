'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Star, Quote, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Multi-Hyphenate Creative',
    avatar: '👩‍🎨',
    content: 'MEUGRIND transformed how I manage my music career, design business, and personal projects. The offline-first approach means I never lose momentum, even when traveling.',
    rating: 5,
    contexts: ['Music', 'Design', 'Personal'],
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Solar Entrepreneur & Influencer',
    avatar: '🌟',
    content: 'Finally, a system that understands my complex workflow. Managing solar leads while creating content has never been this seamless.',
    rating: 5,
    contexts: ['Solar', 'Influencer', 'Business'],
  },
  {
    name: 'Alex Thompson',
    role: 'Band Manager & PR Specialist',
    avatar: '🎵',
    content: 'The band management tools are incredible. Call sheets, setlists, and contractor payments all in one place. My artists love the organization.',
    rating: 5,
    contexts: ['Band', 'PR', 'Events'],
  },
  {
    name: 'Jordan Kim',
    role: 'Creative Director',
    avatar: '🚀',
    content: 'The privacy shield feature is a game-changer. I can keep my personal projects separate from client work while maintaining a unified workflow.',
    rating: 5,
    contexts: ['Creative', 'Business', 'Personal'],
  },
];

const metrics = [
  {
    icon: Users,
    value: '10,000+',
    label: 'Active Creatives',
    description: 'Multi-hyphenate professionals trust MEUGRIND',
  },
  {
    icon: TrendingUp,
    value: '300%',
    label: 'Productivity Increase',
    description: 'Average improvement in task completion',
  },
  {
    icon: Clock,
    value: '2.5M+',
    label: 'Hours Saved',
    description: 'Time recovered through smart automation',
  },
  {
    icon: CheckCircle,
    value: '99.9%',
    label: 'Uptime',
    description: 'Reliable offline-first architecture',
  },
];

export function SocialProof() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metrics Section */}
        <motion.div
          className="text-center mb-20"
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
            Trusted by Creatives
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
              Worldwide
            </span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <motion.div
                  className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <metric.icon className="w-6 h-6 text-white" />
                </motion.div>
                
                <motion.div
                  className="text-3xl font-bold text-gray-900 mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  viewport={{ once: true }}
                >
                  {metric.value}
                </motion.div>
                
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {metric.label}
                </div>
                
                <div className="text-sm text-gray-600">
                  {metric.description}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Creatives Are Saying
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real stories from multi-hyphenate professionals who&rsquo;ve transformed their workflow
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className="p-8 h-full bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                {/* Quote icon */}
                <motion.div
                  className="absolute top-6 right-6 text-purple-200 group-hover:text-purple-300 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Quote className="w-8 h-8" />
                </motion.div>

                <div className="relative z-10">
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Content */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">{testimonial.avatar}</div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Context tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {testimonial.contexts.map((context) => (
                      <span
                        key={context}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-xs font-medium rounded-full"
                      >
                        {context}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-8 mt-16 pt-16 border-t border-gray-200"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center text-gray-500">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center text-gray-500">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium">GDPR Ready</span>
          </div>
          <div className="flex items-center text-gray-500">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center text-gray-500">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium">99.9% Uptime SLA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}