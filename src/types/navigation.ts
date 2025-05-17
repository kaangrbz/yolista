export enum PageName {
  Home = 'Home',
  RouteDetail = 'RouteDetail',
  Profile = 'Profile',
  AddCategory = 'AddCategory',
  CreateRoute = 'CreateRoute',
  Login = 'Login',
  Register = 'Register',
}

export type NavigationParams = {
  [PageName.RouteDetail]: { routeId: string };
  [PageName.Profile]: { userid: string };
  [PageName.AddCategory]: undefined;
  [PageName.CreateRoute]: undefined;
  [PageName.Login]: undefined;
  [PageName.Register]: undefined;
};

export const navigate = (navigation: any, page: PageName, params?: NavigationParams) => {
  console.log('Navigating to:', page, params);
  navigation.navigate(page, params);
};

export const isPageValid = (page: string): page is PageName => {
  return Object.values(PageName).includes(page as PageName);
};
