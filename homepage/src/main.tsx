import React from 'react'
import ReactDOM from 'react-dom/client'
import TradingTools from './Components/TradingTools.tsx'
import './index.css'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Layout from './layout/Layout.tsx';
import Error from './layout/Error.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import AdminPage from './pages/AdminPage.tsx';
import AnalyticsPage from './pages/AnalyticsPage.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      {
        path: "",
        element: <TradingTools />,
      },
      {
        path: "admin",
        element: <AdminPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
    ],
  },
]);

import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)