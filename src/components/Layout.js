import "./Layout.css";
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="layout">
      <Header />

      <div className="layout-body">
        <Sidebar />

        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;