import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "../components/home/Home";
import { Login } from "../components/login/Login";
import { Principal } from "../pages/Principal";
import { RolesPagina } from "../pages/RolesPagina";
import { PermisosPagina } from "../pages/PermisosPagina";
import { RolPermisoPagina } from "../pages/RolPermisoPagina";
import { Bienvenido } from "../pages/Bienvenido";
import { useAuthContext } from "../context/AuthContext";
import { PageLoader } from "../components/common/PageLoader";

const UsuariosPagina = lazy(() =>
  import("../pages/UsuariosPagina").then((m) => ({ default: m.UsuariosPagina })),
);
const SabanaPagina = lazy(() =>
  import("../pages/SabanaPagina").then((m) => ({ default: m.SabanaPagina })),
);
const PlaneacionPedagogica = lazy(() =>
  import("../pages/planeacion/PlaneacionPedagogica").then((m) => ({ default: m.PlaneacionPedagogica })),
);
const InstructorDashboard = lazy(() =>
  import("../pages/instructor/InstructorDashboard").then((m) => ({ default: m.InstructorDashboard })),
);

const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthContext();

  if (!user) return <Login />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Bienvenido />;

  return children;
};

export const AppRutas = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />

    <Route
      path="/instructor"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <LazyPage>
            <InstructorDashboard />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/instructor/dashboard"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <LazyPage>
            <InstructorDashboard />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/sabana/:idFicha"
      element={
        <LazyPage>
          <SabanaPagina />
        </LazyPage>
      }
    />

    <Route
      path="/planeacion/:idFicha?"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <LazyPage>
            <PlaneacionPedagogica />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/principal"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <LazyPage>
            <UsuariosPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/usuarios"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <LazyPage>
            <UsuariosPagina />
          </LazyPage>
        </PrivateRoute>
      }
    />

    <Route
      path="/roles"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <RolesPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/permisos"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <PermisosPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/rol-permisos"
      element={
        <PrivateRoute allowedRoles={["Administrador"]}>
          <RolPermisoPagina />
        </PrivateRoute>
      }
    />

    <Route
      path="/sabana"
      element={
        <PrivateRoute allowedRoles={["Instructor"]}>
          <LazyPage>
            <SabanaPagina />
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
