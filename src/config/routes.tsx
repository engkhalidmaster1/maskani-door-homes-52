import type { RouteObject } from 'react-router-dom';

// Placeholder for Subscribers component - create if needed
const Subscribers = () => <div>Subscribers Page</div>;

export const routes: RouteObject[] = [
  {
    path: '/admin/subscribers',
    element: <Subscribers />,
  },
];
