import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, MessageCircle, Zap, Star, Heart, Sparkles, Trophy, Gift, PartyPopper } from 'lucide-react';

export type EasterEggType = 
  | 'notification-enabled'
  | 'test-notification'
  | 'new-message'
  | 'notification-clicked'
  | 'permission-granted'
  | 'first-message'
  | 'group-created'
  | 'celebration';

interface EasterEggAnimationProps {
  type: EasterEggType;
  trigger: boolean;
  onComplete?: () => void;
  message?: string;
}

const easterEggConfigs = {
  'notification-enabled': {
    icon: Bell,
    colors: ['#10B981', '#34D399', '#6EE7B7'],
    message: 'Notifications enabled! 🎉',
    duration: 2000,
    particles: 15,
    particleIcon: CheckCircle
  },
  'test-notification': {
    icon: Zap,
    colors: ['#3B82F6', '#60A5FA', '#93C5FD'],
    message: 'Test notification sent! ⚡',
    duration: 1500,
    particles: 12,
    particleIcon: Star
  },
  'new-message': {
    icon: MessageCircle,
    colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
    message: 'New message! 💬',
    duration: 1200,
    particles: 10,
    particleIcon: Heart
  },
  'notification-clicked': {
    icon: Sparkles,
    colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
    message: 'Opening message... ✨',
    duration: 1000,
    particles: 8,
    particleIcon: Trophy
  },
  'permission-granted': {
    icon: CheckCircle,
    colors: ['#10B981', '#34D399', '#6EE7B7'],
    message: 'Permission granted! 🎊',
    duration: 2500,
    particles: 20,
    particleIcon: PartyPopper
  },
  'first-message': {
    icon: Gift,
    colors: ['#EC4899', '#F472B6', '#F9A8D4'],
    message: 'Welcome to messaging! 🎁',
    duration: 3000,
    particles: 25,
    particleIcon: Star
  },
  'group-created': {
    icon: Trophy,
    colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
    message: 'Group created! 🏆',
    duration: 2000,
    particles: 18,
    particleIcon: Sparkles
  },
  'celebration': {
    icon: PartyPopper,
    colors: ['#EF4444', '#F87171', '#FCA5A5'],
    message: 'Celebration! 🎉',
    duration: 3000,
    particles: 30,
    particleIcon: Heart
  }
};

export function EasterEggAnimation({ type, trigger, onComplete, message }: EasterEggAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);
  
  const config = easterEggConfigs[type];
  const Icon = config.icon;
  const ParticleIcon = config.particleIcon;

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      
      // Generate particles
      const newParticles = Array.from({ length: config.particles }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: config.colors[Math.floor(Math.random() * config.colors.length)]
      }));
      
      setParticles(newParticles);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, config.duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, config, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      >
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black"
        />
        
        {/* Main animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          {/* Central icon */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: config.colors[0] }}
          >
            <Icon className="w-12 h-12 text-white" />
          </motion.div>
          
          {/* Ripple effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-4"
            style={{ borderColor: config.colors[1] }}
          />
          
          {/* Secondary ripple */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: config.colors[2] }}
          />
        </motion.div>
        
        {/* Particle effects */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0
            }}
            animate={{
              scale: [0, 1, 0],
              x: (particle.x - 50) * 4,
              y: (particle.y - 50) * 4,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              delay: particle.delay,
              ease: "easeOut"
            }}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              color: particle.color
            }}
          >
            <ParticleIcon className="w-6 h-6" />
          </motion.div>
        ))}
        
        {/* Message text */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-20 text-center"
        >
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg border">
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {message || config.message}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing easter egg animations
export function useEasterEggAnimations() {
  const [activeAnimation, setActiveAnimation] = useState<{
    type: EasterEggType;
    trigger: boolean;
    message?: string;
  } | null>(null);

  const triggerAnimation = (type: EasterEggType, message?: string) => {
    setActiveAnimation({ type, trigger: true, message });
  };

  const clearAnimation = () => {
    setActiveAnimation(null);
  };

  return {
    activeAnimation,
    triggerAnimation,
    clearAnimation
  };
}

// Floating confetti component for celebrations
export function FloatingConfetti({ active }: { active: boolean }) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)]
      }));
      setConfetti(newConfetti);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ 
            y: -100,
            x: `${piece.x}%`,
            rotate: 0,
            scale: 0
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: 360,
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            delay: piece.delay,
            ease: "easeOut"
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: piece.color }}
        />
      ))}
    </div>
  );
}