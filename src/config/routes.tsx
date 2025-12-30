import { Route } from 'react-router-dom';
import { Subscribers } from '../components/Subscribers';

export const routes: Route[] = [
  {
    path: '/admin/subscribers',
    element: <Subscribers />,
  },
];