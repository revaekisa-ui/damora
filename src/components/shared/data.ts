export interface AppLink {
  avatar: string;
  href: string;
  title: string;
  subtext: string;
}

export interface QuickLink {
  href: string;
  title: string;
}

export interface DropdownMessage {
  title: string;
  subtitle: string;
  avatar: string;
  time: string;
}

export interface DropdownNotification {
  title: string;
  subtitle: string;
  avatar: string;
}

export const appsLink: AppLink[] = [];
export const pageLinks: QuickLink[] = [];
export const messages: DropdownMessage[] = [];
export const notifications: DropdownNotification[] = [];
