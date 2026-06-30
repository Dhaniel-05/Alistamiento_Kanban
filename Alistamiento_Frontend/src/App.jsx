import { AppRutas } from "./routes/AppRutas";
import { PermissionsRefresher } from "./components/auth/PermissionsRefresher";

export const App = () => {
  return (
    <>
      <PermissionsRefresher />
      <AppRutas />
    </>
  );
};
