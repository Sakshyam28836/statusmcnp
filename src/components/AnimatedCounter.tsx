import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export const AnimatedCounter = ({ value, className, duration = 1.2 }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });

    if (prevValue.current !== value && prevValue.current !== 0) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    }
    prevValue.current = value;

    return controls.stop;
  }, [value, duration]);

  return (
    <motion.span
      className={cn(className, 'inline-block')}
      animate={isPulsing ? {
        scale: [1, 1.15, 1],
        textShadow: [
          '0 0 0px transparent',
          '0 0 12px hsl(var(--primary) / 0.6)',
          '0 0 0px transparent'
        ],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  );
};
