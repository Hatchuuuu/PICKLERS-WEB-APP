"use client";

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedContentProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  container?: string | HTMLElement;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: any;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  className?: string;
}

const AnimatedContent = ({
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = [0.23, 1, 0.32, 1],
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase,
  onComplete,
  onDisappearanceComplete,
  className = '',
  ...props
}: AnimatedContentProps) => {
  const axis = direction === 'horizontal' ? 'x' : 'y';
  const offset = reverse ? -distance : distance;

  return (
    <motion.div
      className={className}
      initial={{ 
        [axis]: offset, 
        scale, 
        opacity: animateOpacity ? initialOpacity : 1 
      }}
      whileInView={{ 
        [axis]: 0, 
        scale: 1, 
        opacity: 1 
      }}
      viewport={{ once: true, amount: threshold > 0 ? threshold : "some" }}
      transition={{ 
        duration, 
        delay,
        ease: Array.isArray(ease) ? ease : [0.23, 1, 0.32, 1]
      }}
      onAnimationComplete={() => {
        if (onComplete) onComplete();
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;
