import { Navigate, createBrowserRouter } from 'react-router-dom'
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from './features/auth/AuthRouteGate'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { ProjectActivityPage } from './pages/projects/ProjectActivityPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { ProjectMembersPage } from './pages/projects/ProjectMembersPage'
import { ProjectTasksPage } from './pages/projects/ProjectTasksPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/',
    element: <PublicOnlyRoute />,
    children: [
      {
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
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: 'projects',
            element: <ProjectsPage />,
          },
          {
            path: 'projects/:projectId',
            element: <ProjectDetailPage />,
            children: [
              {
                index: true,
                element: <Navigate to="tasks" replace />,
              },
              {
                path: 'tasks',
                element: <ProjectTasksPage />,
              },
              {
                path: 'members',
                element: <ProjectMembersPage />,
              },
              {
                path: 'activity',
                element: <ProjectActivityPage />,
              },
            ],
          },
        ],
      },
    ],
  },
])
