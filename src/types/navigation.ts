export enum PageName {
  Home = 'Home',
  RouteDetail = 'RouteDetail',
  Explore = 'Explore',
  Profile = 'Profile',
  AddCategory = 'AddCategory',
  CreateRoute = 'CreateRoute',
  Login = 'Login',
  Register = 'Register',
  Followers = 'Followers',
  Following = 'Following',
}

export type NavigationParams = {
  [PageName.RouteDetail]: { routeId: string };
  [PageName.Explore]: { categoryId?: number };
  [PageName.Profile]: { userid: string };
  [PageName.AddCategory]: undefined;
  [PageName.CreateRoute]: undefined;
  [PageName.Login]: undefined;
  [PageName.Register]: undefined;
  [PageName.Followers]: { userId: string };
  [PageName.Following]: { userId: string };
};

export const navigate = (navigation: any, page: PageName, params?: NavigationParams) => {
  console.info('Navigating to:', page, params);
  navigation.navigate(page, params);
};

export const isPageValid = (page: string): page is PageName => {
  return Object.values(PageName).includes(page as PageName);
};
