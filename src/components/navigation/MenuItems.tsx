import type { ComponentType } from 'react';

export interface MenuItem {
  id: string;
  title?: string;
  subheader?: string;
  navlabel?: boolean;
  href?: string;
  icon?: ComponentType<Record<string, unknown>>;
  children?: MenuItem[];
}

const Menuitems: MenuItem[] = [];

export default Menuitems;
