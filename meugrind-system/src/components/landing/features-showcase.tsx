'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Users, 
  BarChart3, 
  Layers, 
  RefreshCw, 
  Shield,
  Music,
  Camera,
  Sun,
  Megaphone,
  Brain,
  Timer
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Offline-First Architecture',
    description: 'Work seamlessly without internet. Your data syncs automatically when you\'re back online.',
    gradient: 'from-yellow-400 to-orange-500',
    delay: 0.1,
  },
  {
    icon: Layers,
    title: 'Multi-Context Management',
    description: 'Switch between band management, influencer campaigns, solar business, and personal projects effortlessly.',
    gradient: 'from-purple-400 to-pink-500',
    delay: 0.2,
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track your productivity across all contexts with detailed insights and performance metrics.',
    gradient: 'from-blue-400 to-cyan-500',
    delay: 0.3,
  },
  {
    icon: RefreshCw,
    title: 'Real-time Synchronization',
    description: 'Your data stays in sync across all devices with conflict-free collaborative editing.',
    gradient: 'from-green-400 to-emerald-500',
    delay: 0.4,
  },
  {
    icon: Music,
    title: 'Band Management Suite',
    description: 'Manage setlists, call sheets, tech riders, and contractor payments all in one place.',
    gradient: 'from-red-400 to-rose-500',
    delay: 0.5,
  },
  {
    icon: Camera,
    title: 'Influencer Campaign Hub',
    description: 'Track brand deals, manage content pipelines, and avoid conflicts with intelligent scheduling.',
    gradient: 'from-indigo-400 to-purple-500',
    delay: 0.6,
  },
  {
    icon: Sun,
    title: 'Solar Business Tools',
    description: 'Lead capture, project tracking, and sales reporting designed for solar professionals.',
    gradient: 'from-amber-400 to-yellow-500',
    delay: 0.7,
  },
  {
    icon: Megaphone,
    title: 'PR Event Coordination',
    description: 'Schedule appearances, track talking points, and manage your public relations calendar.',
    gradient: 'from-teal-400 to-cyan-500',
    delay: 0.8,
  },
  {
    icon: Brain,
    title: 'Personal Productivity',
    description: 'Study tracking, habit formation, and personal goal management with advanced analytics.',
    gradient: 'from-violet-400 to-purple-500',
    delay: 0.9,
  },
  {
    icon: Timer,
    title: 'Focus & Time Management',
    description: 'Pomodoro timers, focus modes, and distraction blocking to maximize your creative output.',
    gradient: 'from-pink-400 to-red-500',
    delay: 1.0,
  },
  {
    icon: Shield,
    title: 'Privacy Shield',
    description: 'Control what information is visible in each context. Keep your personal and professional lives separate.',
    gradient: 'from-slate-400 to-gray-500',
    delay: 1.1,
  },
  {
    icon: Users,
    title: 'Collaborative Workflows',
    description: 'Share projects with team members while maintaining granular control over permissions and visibility.',
    gradient: 'from-emerald-400 to-teal-500',
    delay: 1.2,
  },
];

export function FeaturesShowcase() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Everything You Need to
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
              Dominate Your Grind
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Built specifically for multi-hyphenate creatives who refuse to compromise. 
            One system, infinite possibilities.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Card className="p-8 h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                {/* Gradient background on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                
                <div className="relative z-10">
                  <motion.div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect border */}
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, rgb(168 85 247), rgb(59 130 246)) border-box`,
                  }}
                />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 mr-2" />
            Ready to supercharge your productivity?
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}