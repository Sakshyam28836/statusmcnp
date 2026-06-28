import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export const AnimatedCounter = ({ value, className, duration = 0.8 }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    const controls = animate(prevValue.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={cn(className, 'inline-block tabular-nums')}>{displayValue}</span>;
};
