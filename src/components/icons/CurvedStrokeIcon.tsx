import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

export interface CurvedStrokeIconProps {
  color: string;
  size?: number;
  focused?: boolean;
}

const STROKE_INACTIVE = 1.75;
const STROKE_ACTIVE = 2.25;

export const getCurvedStrokeWidth = (focused: boolean): number => {
  if (focused) {
    return STROKE_ACTIVE;
  }

  return STROKE_INACTIVE;
};

interface IconFrameProps extends CurvedStrokeIconProps {
  children: (strokeWidth: number) => React.ReactNode;
}

export const IconFrame: React.FC<IconFrameProps> = ({
  color,
  size = 26,
  focused = false,
  children,
}) => {
  const strokeWidth = getCurvedStrokeWidth(focused);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children(strokeWidth)}
      </G>
    </Svg>
  );
};

interface FilledPathProps {
  d: string;
  color: string;
  focused: boolean;
}

export const FilledPath: React.FC<FilledPathProps> = ({ d, color, focused }) => {
  if (!focused) {
    return null;
  }

  return <Path d={d} fill={color} stroke="none" />;
};

export { Path, Circle };
