/**
 * Translation strings for MEUGRIND system
 */

import { Language } from './i18n';

export interface Translations {
  // Navigation
  nav: {
    features: string;
    testimonials: string;
    pricing: string;
    faq: string;
    signIn: string;
    getStarted: string;
  };
  
  // Hero Section
  hero: {
    badge: string;
    title: {
      meugrind: string;
      unleash: string;
      creativePower: string;
    };
    description: string;
    getStartedFree: string;
    signIn: string;
    trustIndicators: {
      offlineFirst: string;
      realTimeSync: string;
      multiContext: string;
      performanceOptimized: string;
    };
  };
  
  // Features
  features: {
    title: string;
    subtitle: string;
    description: string;
    readyToSupercharge: string;
    items: {
      offlineFirst: {
        title: string;
        description: string;
      };
      multiContext: {
        title: string;
        description: string;
      };
      analytics: {
        title: string;
        description: string;
      };
      realTimeSync: {
        title: string;
        description: string;
      };
      bandManagement: {
        title: string;
        description: string;
      };
      influencerHub: {
        title: string;
        description: string;
      };
      solarBusiness: {
        title: string;
        description: string;
      };
      prEvents: {
        title: string;
        description: string;
      };
      personalProductivity: {
        title: string;
        description: string;
      };
      focusManagement: {
        title: string;
        description: string;
      };
      privacyShield: {
        title: string;
        description: string;
      };
      collaborative: {
        title: string;
        description: string;
      };
    };
  };
  
  // Social Proof
  socialProof: {
    title: string;
    subtitle: string;
    testimonials: {
      title: string;
      description: string;
    };
    metrics: {
      activeCreatives: {
        label: string;
        description: string;
      };
      productivityIncrease: {
        label: string;
        description: string;
      };
      hoursSaved: {
        label: string;
        description: string;
      };
      uptime: {
        label: string;
        description: string;
      };
    };
    trustBadges: {
      soc2: string;
      gdpr: string;
      encrypted: string;
      uptime: string;
    };
  };
  
  // FAQ
  faq: {
    title: string;
    subtitle: string;
    description: string;
    stillHaveQuestions: string;
    contactSupport: string;
    contactSupportDescription: string;
    items: {
      whatMakesDifferent: {
        question: string;
        answer: string;
      };
      howOfflineWorks: {
        question: string;
        answer: string;
      };
      separateContexts: {
        question: string;
        answer: string;
      };
      freePlan: {
        question: string;
        answer: string;
      };
      dataSecurity: {
        question: string;
        answer: string;
      };
      collaboration: {
        question: string;
        answer: string;
      };
      platforms: {
        question: string;
        answer: string;
      };
      migration: {
        question: string;
        answer: string;
      };
    };
  };
  
  // CTA Section
  cta: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    benefits: {
      startFree: string;
      noCreditCard: string;
      fullOffline: string;
      instantSetup: string;
    };
    startJourney: string;
    alreadyMember: string;
    trustIndicators: {
      freePlan: string;
      noSetupFees: string;
      cancelAnytime: string;
      support247: string;
    };
    limitedTime: string;
    limitedTimeOffer: string;
  };
  
  // Footer
  footer: {
    description: string;
    newsletter: {
      title: string;
      description: string;
      placeholder: string;
      subscribe: string;
    };
    links: {
      product: string;
      company: string;
      resources: string;
      legal: string;
    };
    madeWith: string;
    forCreatives: string;
    copyright: string;
  };
  
  // Auth
  auth: {
    signIn: {
      title: string;
      description: string;
      email: string;
      password: string;
      signInButton: string;
      noAccount: string;
      signUp: string;
      forgotPassword: string;
    };
    signUp: {
      title: string;
      description: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
      signUpButton: string;
      haveAccount: string;
      signIn: string;
      terms: string;
      privacy: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  pt: {
    nav: {
      features: 'Recursos',
      testimonials: 'Depoimentos',
      pricing: 'Preços',
      faq: 'FAQ',
      signIn: 'Entrar',
      getStarted: 'Começar',
    },
    
    hero: {
      badge: 'O Sistema de Produtividade Definitivo para Criativos Multi-Talentos',
      title: {
        meugrind: 'MEUGRIND',
        unleash: 'Liberte Seu',
        creativePower: 'Poder Criativo',
      },
      description: 'O único sistema de produtividade projetado para criadores que usam múltiplos chapéus. Gerencie perfeitamente sua banda, campanhas de influência, negócios solares, eventos de RP e projetos pessoais—tudo em uma plataforma poderosa e offline-first.',
      getStartedFree: 'Começar Grátis',
      signIn: 'Entrar',
      trustIndicators: {
        offlineFirst: 'Tecnologia Offline-First',
        realTimeSync: 'Sincronização em Tempo Real',
        multiContext: 'Suporte Multi-Contexto',
        performanceOptimized: 'Otimizado para Performance',
      },
    },
    
    features: {
      title: 'Tudo que Você Precisa para',
      subtitle: 'Dominar Seu Grind',
      description: 'Construído especificamente para criativos multi-talentos que se recusam a fazer concessões. Um sistema, infinitas possibilidades.',
      readyToSupercharge: 'Pronto para turbinar sua produtividade?',
      items: {
        offlineFirst: {
          title: 'Arquitetura Offline-First',
          description: 'Trabalhe perfeitamente sem internet. Seus dados sincronizam automaticamente quando você voltar online.',
        },
        multiContext: {
          title: 'Gerenciamento Multi-Contexto',
          description: 'Alterne entre gerenciamento de banda, campanhas de influência, negócios solares e projetos pessoais sem esforço.',
        },
        analytics: {
          title: 'Análises de Performance',
          description: 'Acompanhe sua produtividade em todos os contextos com insights detalhados e métricas de performance.',
        },
        realTimeSync: {
          title: 'Sincronização em Tempo Real',
          description: 'Seus dados permanecem sincronizados em todos os dispositivos com edição colaborativa livre de conflitos.',
        },
        bandManagement: {
          title: 'Suíte de Gerenciamento de Banda',
          description: 'Gerencie setlists, call sheets, tech riders e pagamentos de contratados tudo em um lugar.',
        },
        influencerHub: {
          title: 'Hub de Campanhas de Influência',
          description: 'Acompanhe brand deals, gerencie pipelines de conteúdo e evite conflitos com agendamento inteligente.',
        },
        solarBusiness: {
          title: 'Ferramentas para Negócios Solares',
          description: 'Captura de leads, acompanhamento de projetos e relatórios de vendas projetados para profissionais solares.',
        },
        prEvents: {
          title: 'Coordenação de Eventos de RP',
          description: 'Agende aparições, acompanhe talking points e gerencie seu calendário de relações públicas.',
        },
        personalProductivity: {
          title: 'Produtividade Pessoal',
          description: 'Acompanhamento de estudos, formação de hábitos e gerenciamento de metas pessoais com análises avançadas.',
        },
        focusManagement: {
          title: 'Foco e Gerenciamento de Tempo',
          description: 'Timers Pomodoro, modos de foco e bloqueio de distrações para maximizar sua produção criativa.',
        },
        privacyShield: {
          title: 'Escudo de Privacidade',
          description: 'Controle quais informações são visíveis em cada contexto. Mantenha sua vida pessoal e profissional separadas.',
        },
        collaborative: {
          title: 'Fluxos de Trabalho Colaborativos',
          description: 'Compartilhe projetos com membros da equipe mantendo controle granular sobre permissões e visibilidade.',
        },
      },
    },
    
    socialProof: {
      title: 'Confiado por Criativos',
      subtitle: 'Pelo Mundo Todo',
      testimonials: {
        title: 'O que os Criativos Estão Dizendo',
        description: 'Histórias reais de profissionais multi-talentos que transformaram seu fluxo de trabalho',
      },
      metrics: {
        activeCreatives: {
          label: 'Criativos Ativos',
          description: 'Profissionais multi-talentos confiam no MEUGRIND',
        },
        productivityIncrease: {
          label: 'Aumento de Produtividade',
          description: 'Melhoria média na conclusão de tarefas',
        },
        hoursSaved: {
          label: 'Horas Economizadas',
          description: 'Tempo recuperado através de automação inteligente',
        },
        uptime: {
          label: 'Uptime',
          description: 'Arquitetura offline-first confiável',
        },
      },
      trustBadges: {
        soc2: 'Compatível com SOC 2',
        gdpr: 'Pronto para GDPR',
        encrypted: 'Criptografado Ponta a Ponta',
        uptime: 'SLA de 99.9% Uptime',
      },
    },
    
    faq: {
      title: 'Perguntas',
      subtitle: 'Frequentes',
      description: 'Tudo que você precisa saber sobre o MEUGRIND e como ele pode transformar seu fluxo de trabalho criativo',
      stillHaveQuestions: 'Ainda tem dúvidas?',
      contactSupport: 'Entrar em Contato',
      contactSupportDescription: 'Nossa equipe de suporte está aqui para ajudar você a aproveitar ao máximo o MEUGRIND',
      items: {
        whatMakesDifferent: {
          question: 'O que torna o MEUGRIND diferente de outras ferramentas de produtividade?',
          answer: 'O MEUGRIND é especificamente projetado para criativos multi-talentos que gerenciam múltiplos empreendimentos. Ao contrário de ferramentas genéricas de produtividade, fornecemos módulos especializados para gerenciamento de banda, campanhas de influência, negócios solares, eventos de RP e projetos pessoais—tudo com arquitetura offline-first e controles de privacidade.',
        },
        howOfflineWorks: {
          question: 'Como funciona a abordagem offline-first?',
          answer: 'O MEUGRIND funciona completamente offline armazenando todos os seus dados localmente no seu dispositivo. Quando você volta online, sincroniza automaticamente suas mudanças em todos os dispositivos usando edição colaborativa livre de conflitos. Você nunca perde produtividade, mesmo sem internet.',
        },
        separateContexts: {
          question: 'Posso manter meus diferentes contextos separados?',
          answer: 'Absolutamente! Nosso recurso Escudo de Privacidade permite controlar quais informações são visíveis em cada contexto. Você pode manter seus projetos pessoais completamente separados dos seus empreendimentos comerciais enquanto ainda gerencia tudo de um sistema unificado.',
        },
        freePlan: {
          question: 'Existe um plano gratuito disponível?',
          answer: 'Sim! O MEUGRIND oferece um plano gratuito generoso que inclui recursos principais de produtividade, funcionalidade offline e sincronização básica entre dispositivos. Planos premium desbloqueiam recursos avançados como contextos ilimitados, colaboração em equipe e suporte prioritário.',
        },
        dataSecurity: {
          question: 'Quão seguro são meus dados?',
          answer: 'A segurança dos seus dados é nossa prioridade máxima. Usamos criptografia ponta a ponta, somos compatíveis com SOC 2, prontos para GDPR e mantemos um SLA de 99.9% de uptime. Seus dados são armazenados localmente primeiro, dando a você controle completo sobre suas informações.',
        },
        collaboration: {
          question: 'Posso colaborar com membros da equipe?',
          answer: 'Sim! O MEUGRIND suporta fluxos de trabalho colaborativos com controles de permissão granulares. Você pode compartilhar projetos específicos ou contextos com membros da equipe mantendo privacidade para outras áreas do seu trabalho.',
        },
        platforms: {
          question: 'Quais dispositivos e plataformas são suportados?',
          answer: 'O MEUGRIND funciona em todos os navegadores modernos e é projetado como um Progressive Web App (PWA), então funciona perfeitamente em desktop, tablet e dispositivos móveis. Aplicativos nativos para iOS e Android estão chegando em breve.',
        },
        migration: {
          question: 'Como migro meus dados existentes?',
          answer: 'Fornecemos ferramentas de importação para plataformas populares de produtividade e ferramentas de gerenciamento de projetos. Nosso processo de onboarding inclui migração de dados guiada, e nossa equipe de suporte está disponível para ajudar com migrações complexas.',
        },
      },
    },
    
    cta: {
      badge: 'Junte-se a milhares de criativos bem-sucedidos',
      title: 'Pronto para Transformar',
      subtitle: 'Seu Fluxo de Trabalho Criativo?',
      description: 'Pare de fazer malabarismos com múltiplas ferramentas e plataformas. Comece a gerenciar todos os seus empreendimentos criativos de um sistema poderoso e unificado projetado especificamente para você.',
      benefits: {
        startFree: 'Comece grátis, faça upgrade quando estiver pronto',
        noCreditCard: 'Não é necessário cartão de crédito',
        fullOffline: 'Funcionalidade offline completa',
        instantSetup: 'Configuração instantânea em menos de 2 minutos',
      },
      startJourney: 'Comece Sua Jornada Gratuita',
      alreadyMember: 'Já é Membro? Entre',
      trustIndicators: {
        freePlan: 'Plano Gratuito Para Sempre',
        noSetupFees: 'Sem Taxas de Configuração',
        cancelAnytime: 'Cancele a Qualquer Momento',
        support247: 'Suporte 24/7',
      },
      limitedTime: 'Tempo Limitado:',
      limitedTimeOffer: 'Obtenha recursos premium grátis no seu primeiro mês',
    },
    
    footer: {
      description: 'O sistema de produtividade definitivo para criativos multi-talentos. Gerencie todos os seus empreendimentos de uma plataforma poderosa e offline-first.',
      newsletter: {
        title: 'Mantenha-se Atualizado com o MEUGRIND',
        description: 'Receba as últimas atualizações, dicas de produtividade e anúncios de recursos entregues na sua caixa de entrada.',
        placeholder: 'Digite seu email',
        subscribe: 'Inscrever-se',
      },
      links: {
        product: 'Produto',
        company: 'Empresa',
        resources: 'Recursos',
        legal: 'Legal',
      },
      madeWith: 'Feito com',
      forCreatives: 'para criativos multi-talentos',
      copyright: '© 2024 MEUGRIND. Todos os direitos reservados.',
    },
    
    auth: {
      signIn: {
        title: 'Entrar no MEUGRIND',
        description: 'Entre na sua conta para acessar o sistema MEUGRIND',
        email: 'Email',
        password: 'Senha',
        signInButton: 'Entrar',
        noAccount: 'Não tem uma conta?',
        signUp: 'Criar Conta',
        forgotPassword: 'Esqueceu a senha?',
      },
      signUp: {
        title: 'Criar Conta MEUGRIND',
        description: 'Crie sua conta para começar sua jornada de produtividade',
        firstName: 'Nome',
        lastName: 'Sobrenome',
        email: 'Email',
        password: 'Senha',
        confirmPassword: 'Confirmar Senha',
        signUpButton: 'Criar Conta',
        haveAccount: 'Já tem uma conta?',
        signIn: 'Entrar',
        terms: 'Termos de Serviço',
        privacy: 'Política de Privacidade',
      },
    },
  },
  
  en: {
    nav: {
      features: 'Features',
      testimonials: 'Testimonials',
      pricing: 'Pricing',
      faq: 'FAQ',
      signIn: 'Sign In',
      getStarted: 'Get Started',
    },
    
    hero: {
      badge: 'The Ultimate Productivity System for Multi-Hyphenate Creatives',
      title: {
        meugrind: 'MEUGRIND',
        unleash: 'Unleash Your',
        creativePower: 'Creative Power',
      },
      description: 'The only productivity system designed for creators who wear multiple hats. Seamlessly manage your band, influence campaigns, solar business, PR events, and personal projects—all in one powerful, offline-first platform.',
      getStartedFree: 'Get Started Free',
      signIn: 'Sign In',
      trustIndicators: {
        offlineFirst: 'Offline-First Technology',
        realTimeSync: 'Real-time Sync',
        multiContext: 'Multi-Context Support',
        performanceOptimized: 'Performance Optimized',
      },
    },
    
    features: {
      title: 'Everything You Need to',
      subtitle: 'Dominate Your Grind',
      description: 'Built specifically for multi-hyphenate creatives who refuse to compromise. One system, infinite possibilities.',
      readyToSupercharge: 'Ready to supercharge your productivity?',
      items: {
        offlineFirst: {
          title: 'Offline-First Architecture',
          description: 'Work seamlessly without internet. Your data syncs automatically when you\'re back online.',
        },
        multiContext: {
          title: 'Multi-Context Management',
          description: 'Switch between band management, influencer campaigns, solar business, and personal projects effortlessly.',
        },
        analytics: {
          title: 'Performance Analytics',
          description: 'Track your productivity across all contexts with detailed insights and performance metrics.',
        },
        realTimeSync: {
          title: 'Real-time Synchronization',
          description: 'Your data stays in sync across all devices with conflict-free collaborative editing.',
        },
        bandManagement: {
          title: 'Band Management Suite',
          description: 'Manage setlists, call sheets, tech riders, and contractor payments all in one place.',
        },
        influencerHub: {
          title: 'Influencer Campaign Hub',
          description: 'Track brand deals, manage content pipelines, and avoid conflicts with intelligent scheduling.',
        },
        solarBusiness: {
          title: 'Solar Business Tools',
          description: 'Lead capture, project tracking, and sales reporting designed for solar professionals.',
        },
        prEvents: {
          title: 'PR Event Coordination',
          description: 'Schedule appearances, track talking points, and manage your public relations calendar.',
        },
        personalProductivity: {
          title: 'Personal Productivity',
          description: 'Study tracking, habit formation, and personal goal management with advanced analytics.',
        },
        focusManagement: {
          title: 'Focus & Time Management',
          description: 'Pomodoro timers, focus modes, and distraction blocking to maximize your creative output.',
        },
        privacyShield: {
          title: 'Privacy Shield',
          description: 'Control what information is visible in each context. Keep your personal and professional lives separate.',
        },
        collaborative: {
          title: 'Collaborative Workflows',
          description: 'Share projects with team members while maintaining granular control over permissions and visibility.',
        },
      },
    },
    
    socialProof: {
      title: 'Trusted by Creatives',
      subtitle: 'Worldwide',
      testimonials: {
        title: 'What Creatives Are Saying',
        description: 'Real stories from multi-hyphenate professionals who\'ve transformed their workflow',
      },
      metrics: {
        activeCreatives: {
          label: 'Active Creatives',
          description: 'Multi-hyphenate professionals trust MEUGRIND',
        },
        productivityIncrease: {
          label: 'Productivity Increase',
          description: 'Average improvement in task completion',
        },
        hoursSaved: {
          label: 'Hours Saved',
          description: 'Time recovered through smart automation',
        },
        uptime: {
          label: 'Uptime',
          description: 'Reliable offline-first architecture',
        },
      },
      trustBadges: {
        soc2: 'SOC 2 Compliant',
        gdpr: 'GDPR Ready',
        encrypted: 'End-to-End Encrypted',
        uptime: '99.9% Uptime SLA',
      },
    },
    
    faq: {
      title: 'Frequently Asked',
      subtitle: 'Questions',
      description: 'Everything you need to know about MEUGRIND and how it can transform your creative workflow',
      stillHaveQuestions: 'Still have questions?',
      contactSupport: 'Contact Support',
      contactSupportDescription: 'Our support team is here to help you get the most out of MEUGRIND',
      items: {
        whatMakesDifferent: {
          question: 'What makes MEUGRIND different from other productivity tools?',
          answer: 'MEUGRIND is specifically designed for multi-hyphenate creatives who manage multiple ventures. Unlike generic productivity tools, we provide specialized modules for band management, influencer campaigns, solar business, PR events, and personal projects—all with offline-first architecture and privacy controls.',
        },
        howOfflineWorks: {
          question: 'How does the offline-first approach work?',
          answer: 'MEUGRIND works completely offline by storing all your data locally on your device. When you\'re back online, it automatically syncs your changes across all devices using conflict-free collaborative editing. You never lose productivity, even without internet.',
        },
        separateContexts: {
          question: 'Can I keep my different contexts separate?',
          answer: 'Absolutely! Our Privacy Shield feature lets you control what information is visible in each context. You can keep your personal projects completely separate from your business ventures while still managing everything from one unified system.',
        },
        freePlan: {
          question: 'Is there a free plan available?',
          answer: 'Yes! MEUGRIND offers a generous free plan that includes core productivity features, offline functionality, and basic sync across devices. Premium plans unlock advanced features like unlimited contexts, team collaboration, and priority support.',
        },
        dataSecurity: {
          question: 'How secure is my data?',
          answer: 'Your data security is our top priority. We use end-to-end encryption, are SOC 2 compliant, GDPR ready, and maintain a 99.9% uptime SLA. Your data is stored locally first, giving you complete control over your information.',
        },
        collaboration: {
          question: 'Can I collaborate with team members?',
          answer: 'Yes! MEUGRIND supports collaborative workflows with granular permission controls. You can share specific projects or contexts with team members while maintaining privacy for other areas of your work.',
        },
        platforms: {
          question: 'What devices and platforms are supported?',
          answer: 'MEUGRIND works on all modern web browsers and is designed as a Progressive Web App (PWA), so it works seamlessly on desktop, tablet, and mobile devices. Native apps for iOS and Android are coming soon.',
        },
        migration: {
          question: 'How do I migrate my existing data?',
          answer: 'We provide import tools for popular productivity platforms and project management tools. Our onboarding process includes guided data migration, and our support team is available to help with complex migrations.',
        },
      },
    },
    
    cta: {
      badge: 'Join thousands of successful creatives',
      title: 'Ready to Transform',
      subtitle: 'Your Creative Workflow?',
      description: 'Stop juggling multiple tools and platforms. Start managing all your creative ventures from one powerful, unified system designed specifically for you.',
      benefits: {
        startFree: 'Start free, upgrade when you\'re ready',
        noCreditCard: 'No credit card required',
        fullOffline: 'Full offline functionality',
        instantSetup: 'Instant setup in under 2 minutes',
      },
      startJourney: 'Start Your Free Journey',
      alreadyMember: 'Already a Member? Sign In',
      trustIndicators: {
        freePlan: 'Free Forever Plan',
        noSetupFees: 'No Setup Fees',
        cancelAnytime: 'Cancel Anytime',
        support247: '24/7 Support',
      },
      limitedTime: 'Limited Time:',
      limitedTimeOffer: 'Get premium features free for your first month',
    },
    
    footer: {
      description: 'The ultimate productivity system for multi-hyphenate creatives. Manage all your ventures from one powerful, offline-first platform.',
      newsletter: {
        title: 'Stay Updated with MEUGRIND',
        description: 'Get the latest updates, productivity tips, and feature announcements delivered to your inbox.',
        placeholder: 'Enter your email',
        subscribe: 'Subscribe',
      },
      links: {
        product: 'Product',
        company: 'Company',
        resources: 'Resources',
        legal: 'Legal',
      },
      madeWith: 'Made with',
      forCreatives: 'for multi-hyphenate creatives',
      copyright: '© 2024 MEUGRIND. All rights reserved.',
    },
    
    auth: {
      signIn: {
        title: 'Sign In to MEUGRIND',
        description: 'Please sign in to access the MEUGRIND system',
        email: 'Email',
        password: 'Password',
        signInButton: 'Sign In',
        noAccount: 'Don\'t have an account?',
        signUp: 'Create Account',
        forgotPassword: 'Forgot password?',
      },
      signUp: {
        title: 'Create MEUGRIND Account',
        description: 'Create your account to start your productivity journey',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        signUpButton: 'Create Account',
        haveAccount: 'Already have an account?',
        signIn: 'Sign In',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
      },
    },
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language];
}