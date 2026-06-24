import type { DirectionManeuverType } from '../types/routeSegment.types';

type OsrmManeuverLike = {
  type?: string;
  modifier?: string;
};

export const resolveManeuverType = (
  maneuver?: OsrmManeuverLike | null,
): DirectionManeuverType => {
  if (!maneuver) {
    return 'default';
  }

  const type = maneuver.type?.toLowerCase() ?? '';
  const modifier = maneuver.modifier?.toLowerCase() ?? '';

  if (type === 'arrive') {
    return 'arrive';
  }

  if (type === 'depart') {
    return 'depart';
  }

  if (type === 'roundabout' || type === 'rotary') {
    return 'roundabout';
  }

  if (type === 'merge' || type === 'fork' || type === 'end of road') {
    return 'merge';
  }

  if (modifier.includes('uturn') || modifier.includes('u turn')) {
    return 'uturn';
  }

  if (modifier.includes('sharp left')) {
    return 'sharp-left';
  }

  if (modifier.includes('sharp right')) {
    return 'sharp-right';
  }

  if (modifier.includes('slight left') || modifier.includes('bear left')) {
    return 'slight-left';
  }

  if (modifier.includes('slight right') || modifier.includes('bear right')) {
    return 'slight-right';
  }

  if (modifier === 'left') {
    return 'left';
  }

  if (modifier === 'right') {
    return 'right';
  }

  if (
    modifier === 'straight' ||
    type === 'continue' ||
    type === 'new name'
  ) {
    return 'straight';
  }

  return 'default';
};

export const getDirectionStepIcon = (
  maneuverType: DirectionManeuverType,
): string => {
  switch (maneuverType) {
    case 'left':
      return 'arrow-left-bold';
    case 'right':
      return 'arrow-right-bold';
    case 'slight-left':
      return 'arrow-top-left';
    case 'slight-right':
      return 'arrow-top-right';
    case 'sharp-left':
      return 'arrow-left-top-bold';
    case 'sharp-right':
      return 'arrow-right-top-bold';
    case 'uturn':
      return 'arrow-u-left-top-bold';
    case 'arrive':
      return 'flag-checkered';
    case 'depart':
      return 'flag';
    case 'merge':
      return 'merge';
    case 'roundabout':
      return 'rotate-right';
    case 'straight':
      return 'arrow-up-bold';
    default:
      return 'arrow-up-bold';
  }
};
