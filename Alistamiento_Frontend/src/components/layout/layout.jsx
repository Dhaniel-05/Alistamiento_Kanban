import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import "./layout.css";

export const Layout = ({ children, showSidebar = false, fichaInfo = null }) => {
  return (
    <div className="app-layout">
      <Header />
      {showSidebar && <Sidebar fichaInfo={fichaInfo} />}
      <div className={`content-wrapper ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;