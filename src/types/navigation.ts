import type { RouteDetailParams } from './routeDetailNavigation.types';

export enum PageName {
  Home = 'Home',
  RouteDetail = 'RouteDetail',
  Explore = 'Explore',
  Profile = 'Profile',
  AddCategory = 'AddCategory',
  CreateRoute = 'CreateRoute',
  Login = 'Login',
  Register = 'Register',
  SocialUserList = 'SocialUserList',
  CommentSection = 'CommentSection',
}

export type NavigationParams = {
  [PageName.RouteDetail]: RouteDetailParams;
  [PageName.Explore]: { categoryId?: number };
  [PageName.Profile]: { username: string };
  [PageName.AddCategory]: undefined;
  [PageName.CreateRoute]: undefined;
  [PageName.Login]: undefined;
  [PageName.Register]: undefined;
  [PageName.SocialUserList]:
    | { kind: 'followers'; userId: string }
    | { kind: 'following'; userId: string }
    | { kind: 'route_likers'; routeId: string; likeCount?: number };
  [PageName.CommentSection]: { routeId: string; parentType: 'routeDetail' | 'bookmarkDetail' | 'homePage' };
};

export const navigate = (navigation: any, page: PageName, params?: NavigationParams) => {
  console.info('Navigating to:', page, params);
  navigation.navigate(page, params);
};

export const isPageValid = (page: string): page is PageName => {
  return Object.values(PageName).includes(page as PageName);
};
