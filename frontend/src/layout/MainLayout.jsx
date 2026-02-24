import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import './MainLayout.scss'; // Importamos el nuevo archivo de estilos

const MainLayout = () => {
  return (
    <div className='main-layout-container'>
      <Sidebar />

      <main className='main-content'>
        <div className='main-wrapper'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
