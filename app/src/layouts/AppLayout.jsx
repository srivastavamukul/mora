import { Outlet } from 'react-router-dom'
import SideNav from './SideNav'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="m-shell mora">
      <div className="m-grain-overlay" />
      <SideNav />
      <main className="m-main">
        <TopBar />
        <div className="m-content">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
