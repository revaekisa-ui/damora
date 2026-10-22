import { Box } from '@mui/material';
import Logo from '../components/ui/Logo';
import MobileRightSidebar from './MobileRightSidebar';
import SidebarItems from '../components/navigation/SidebarItems';
import NavListing from '../components/navigation/NavListing';

export function LegacyHeader() {
  return (
    <Box
      component="header"
      sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minHeight: 64, px: 3 }}
    >
      <Logo />
      <MobileRightSidebar />
    </Box>
  );
}

export function LegacySidebar() {
  return (
    <Box component="aside" sx={{ minWidth: 260, py: 2 }}>
      <SidebarItems />
    </Box>
  );
}

export function LegacyNavigation() {
  return <NavListing />;
}
