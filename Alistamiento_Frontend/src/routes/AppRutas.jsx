import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from '../components/home/Home';
import { Login } from '../components/login/Login';
import { RolesPagina } from '../pages/RolesPagina';
import { PermisosPagina } from '../pages/PermisosPagina';
import { RolPermisoPagina } from '../pages/RolPermisoPagina';
import { Bienvenido } from '../pages/Bienvenido';
import { PrivateRoute } from './PrivateRoute';
import { PageLoader } from '../components/common/PageLoader';

const UsuariosPagina = lazy(() =>
  import('../pages/UsuariosPagina').then((m) => ({ default: m.UsuariosPagina })),
);
const SabanaPagina = lazy(() =>
  import('../pages/SabanaPagina').then((m) => ({ default: m.SabanaPagina })),
);
const PlaneacionPedagogica = lazy(() =>
  import('../pages/planeacion/PlaneacionPedagogica').then((m) => ({ default: m.PlaneacionPedagogica })),
);
const InstructorDashboard = lazy(() =>
  import('../pages/instructor/InstructorDashboard').then((m) => ({ default: m.InstructorDashboard })),
);
const FasesConfiguracionPagina = lazy(() =>
  import('../pages/FasesConfiguracionPagina').then((m) => ({ default: m.FasesConfiguracionPagina })),
);

const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const PERMISOS_PANEL_USUARIOS = [
  'instructor.crear',
  'programa.leer',
  'ficha.leer',
  'permiso.administrar',
  'fase.gestionar',
];

export const AppRutas = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />

    <Route
      path="/instructor"
      element={
        <PrivateRoute allowedRoles={['Instructor']}>
          <LazyPage>
            <InstructorDashboard />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/instructor/dashboard"
      element={
        <PrivateRoute allowedRoles={['Instructor']}>
          <LazyPage>
            <InstructorDashboard />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/sabana/:idFicha"
      element={
        <PrivateRoute permiso="ficha.leer">
          <LazyPage>
            <SabanaPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/planeacion/:idFicha?"
      element={
        <PrivateRoute permiso="planeacion.gestionar">
          <LazyPage>
            <PlaneacionPedagogica />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/principal"
      element={
        <PrivateRoute permisos={PERMISOS_PANEL_USUARIOS}>
          <LazyPage>
            <UsuariosPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/usuarios"
      element={
        <PrivateRoute permisos={PERMISOS_PANEL_USUARIOS}>
          <LazyPage>
            <UsuariosPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/roles"
      element={
        <PrivateRoute permiso="permiso.administrar">
          <RolesPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/permisos"
      element={
        <PrivateRoute permiso="permiso.administrar">
          <PermisosPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/rol-permisos"
      element={
        <PrivateRoute permiso="permiso.administrar">
          <RolPermisoPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/sabana"
      element={
        <PrivateRoute permiso="ficha.leer">
          <LazyPage>
            <SabanaPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/fases-configuracion"
      element={
        <PrivateRoute permiso="fase.gestionar">
          <LazyPage>
            <FasesConfiguracionPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/bienvenido"
      element={
        <PrivateRoute>
          <Bienvenido />
        </PrivateRoute>
      }
    />
  </Routes>
);
