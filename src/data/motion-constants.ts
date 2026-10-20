export const EASE = [0.22, 1, 0.36, 1] as const;

export const rise = {
  hidden: { y: 30, opacity: 0 },
  show: (i = 0) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, delay: i * 0.08, ease: EASE },
  }),
} as const;
