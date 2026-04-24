import { z } from 'zod';

export const zURL = () =>
  z.string().refine(
    val => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL' }
  );
