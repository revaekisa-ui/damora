import { Outlet } from "react-router";
import LoadingBar from '../components/ui/LoadingBar';

const BlankLayout = () => (
  <>
    <LoadingBar />
    <Outlet />
  </>
);

export default BlankLayout;
