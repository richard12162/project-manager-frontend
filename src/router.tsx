import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
    ],
  },
])
