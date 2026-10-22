// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Loadable from '../components/ui/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/BlankLayout')));

/* ****Pages***** */
const SamplePage = Loadable(lazy(() => import('../pages/SamplePage')))
const Error = Loadable(lazy(() => import('../components/ui/Error')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/sample-page" /> },
      { path: '/sample-page', exact: true, element: <SamplePage /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);
export default router;
