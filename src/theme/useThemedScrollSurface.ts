import { useMemo } from 'react';
import { useAppTheme } from '../context/AppThemeContext';
import { themedScrollSurface } from './themedScrollSurface';

export function useThemedScrollSurface() {
  const theme = useAppTheme();
  return useMemo(() => themedScrollSurface(theme), [theme]);
}
