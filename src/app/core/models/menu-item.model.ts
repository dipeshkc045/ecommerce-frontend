import { UserRole } from './user.model';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;       // SVG path or icon name
  route?: string;
  children?: MenuItem[];
  roles?: UserRole[];  // undefined = visible to all
  badge?: string | number;
  isExternal?: boolean;
  isActive?: boolean;
}
