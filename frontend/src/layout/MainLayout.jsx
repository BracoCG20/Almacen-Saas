import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';

const MainLayout = () => {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
      }}
    >
      <Sidebar />

      <main style={{ flex: 1, padding: '2.5vh 2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
