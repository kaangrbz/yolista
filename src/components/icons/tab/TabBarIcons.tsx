import React from 'react';
import { Path, Circle, IconFrame, FilledPath } from '../CurvedStrokeIcon';
import type { CurvedStrokeIconProps } from '../CurvedStrokeIcon';

export const TabHomeIcon: React.FC<CurvedStrokeIconProps> = (props) => {
  const { focused = false } = props;

  return (
    <IconFrame {...props}>
      {() => (
        <>
          <FilledPath
            d="M4 10.2 L12 4.2 L20 10.2 V19.2 C20 19.75 19.55 20.2 19 20.2 H5 C4.45 20.2 4 19.75 4 19.2 Z"
            color={props.color}
            focused={focused}
          />
          <Path d="M4 10.2 L12 4.2 L20 10.2" />
          <Path d="M4 10.2 V19.2 C4 19.75 4.45 20.2 5 20.2 H9.5" />
          <Path d="M20 10.2 V19.2 C20 19.75 19.55 20.2 19 20.2 H14.5" />
          <Path d="M9.5 20.2 V14.5 C9.5 13.95 9.95 13.5 10.5 13.5 H13.5 C14.05 13.5 14.5 13.95 14.5 14.5 V20.2" />
        </>
      )}
    </IconFrame>
  );
};

export const TabExploreIcon: React.FC<CurvedStrokeIconProps> = (props) => {
  const { focused = false } = props;

  return (
    <IconFrame {...props}>
      {() => (
        <>
          <FilledPath
            d="M11 5.5 C7.41 5.5 4.5 8.41 4.5 12 C4.5 15.59 7.41 18.5 11 18.5 C14.59 18.5 17.5 15.59 17.5 12 C17.5 8.41 14.59 5.5 11 5.5 Z"
            color={props.color}
            focused={focused}
          />
          <Circle cx={11} cy={12} r={6.5} />
          <Path d="M16.2 16.2 L20.5 20.5" />
        </>
      )}
    </IconFrame>
  );
};

const CREATE_LEAF_PATH =
  'M12 8.2 C13.8 8.2 15.2 9.55 15.2 11.35 C15.2 14.1 12 16.4 12 16.4 C12 16.4 8.8 14.1 8.8 11.35 C8.8 9.55 10.2 8.2 12 8.2 Z';

export const TabCreateIcon: React.FC<CurvedStrokeIconProps> = (props) => {
  const size = props.size ?? 30;
  const { focused = false } = props;

  return (
    <IconFrame {...props} size={size}>
      {() => (
        <>
          <Circle cx={12} cy={12} r={9} />
          <FilledPath
            d={CREATE_LEAF_PATH}
            color={props.color}
            focused={focused}
          />
          <Path d={CREATE_LEAF_PATH} />
          <Path d="M12 10.5 C12.8 10.5 13.5 11.15 13.5 12" />
        </>
      )}
    </IconFrame>
  );
};

export const TabNotificationsIcon: React.FC<CurvedStrokeIconProps> = (props) => {
  const { focused = false } = props;

  return (
    <IconFrame {...props}>
      {() => (
        <>
          <FilledPath
            d="M12 5.2 C9.55 5.2 7.7 7.05 7.7 9.5 V11.1 C7.7 11.8 7.5 12.45 7.15 12.95 L6.1 14.55 C5.7 15.15 6.1 15.85 6.8 15.85 H17.2 C17.9 15.85 18.3 15.15 17.9 14.55 L16.85 12.95 C16.5 12.45 16.3 11.8 16.3 11.1 V9.5 C16.3 7.05 14.45 5.2 12 5.2 Z"
            color={props.color}
            focused={focused}
          />
          <Path d="M12 5.2 C9.55 5.2 7.7 7.05 7.7 9.5 V11.1 C7.7 11.8 7.5 12.45 7.15 12.95 L6.1 14.55 C5.7 15.15 6.1 15.85 6.8 15.85 H17.2 C17.9 15.85 18.3 15.15 17.9 14.55 L16.85 12.95 C16.5 12.45 16.3 11.8 16.3 11.1 V9.5 C16.3 7.05 14.45 5.2 12 5.2 Z" />
          <Path d="M10.3 15.85 C10.55 17 11.2 17.85 12 17.85 C12.8 17.85 13.45 17 13.7 15.85" />
        </>
      )}
    </IconFrame>
  );
};

export const TabProfileIcon: React.FC<CurvedStrokeIconProps> = (props) => {
  const { focused = false } = props;

  return (
    <IconFrame {...props}>
      {() => (
        <>
          <FilledPath
            d="M6.5 19.5 C6.5 16.46 8.96 14 12 14 C15.04 14 17.5 16.46 17.5 19.5 Z"
            color={props.color}
            focused={focused}
          />
          <FilledPath
            d="M12 5.5 C14.49 5.5 16.5 7.51 16.5 10 C16.5 12.49 14.49 14.5 12 14.5 C9.51 14.5 7.5 12.49 7.5 10 C7.5 7.51 9.51 5.5 12 5.5 Z"
            color={props.color}
            focused={focused}
          />
          <Circle cx={12} cy={10} r={3.5} />
          <Path d="M6.5 19.5 C6.5 16.46 8.96 14 12 14 C15.04 14 17.5 16.46 17.5 19.5" />
        </>
      )}
    </IconFrame>
  );
};

export type TabBarIconName = 'home' | 'explore' | 'create' | 'notifications' | 'profile';

interface TabBarIconProps extends CurvedStrokeIconProps {
  name: TabBarIconName;
}

const TAB_ICON_MAP: Record<TabBarIconName, React.FC<CurvedStrokeIconProps>> = {
  home: TabHomeIcon,
  explore: TabExploreIcon,
  create: TabCreateIcon,
  notifications: TabNotificationsIcon,
  profile: TabProfileIcon,
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, ...iconProps }) => {
  const IconComponent = TAB_ICON_MAP[name];

  return <IconComponent {...iconProps} />;
};
