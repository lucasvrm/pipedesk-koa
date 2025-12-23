// Test file to verify imports work correctly
import {
  SettingsSidebarNav,
  SettingsSidebarLayout,
  SettingsSectionHeader,
  SidebarNavItem
} from './index';

// Type check - if this compiles, imports are correct
const _typeCheck: {
  nav: typeof SettingsSidebarNav;
  layout: typeof SettingsSidebarLayout;
  header: typeof SettingsSectionHeader;
  item: SidebarNavItem;
} = {} as any;

export {};
