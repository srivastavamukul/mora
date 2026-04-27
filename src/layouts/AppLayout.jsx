import { Outlet } from 'react-router-dom'
import SideNav from './SideNav'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-on-surface antialiased overflow-x-hidden">
      <div className="noise-overlay" />
      <SideNav />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopBar />
        <main className="flex-1 pt-16">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
