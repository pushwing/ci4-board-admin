import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import BoardsPage from './pages/boards/BoardsPage'
import MembersPage from './pages/members/MembersPage'
import ArticlesPage from './pages/articles/ArticlesPage'
import SettingPage from './pages/setting/SettingPage'
import PagesPage from './pages/cms/PagesPage'
import BannersPage from './pages/cms/BannersPage'
import PopupsPage from './pages/cms/PopupsPage'
import MenusPage from './pages/cms/MenusPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/boards" replace />} />
          {/* 운영 관리 */}
          <Route path="boards"   element={<BoardsPage />} />
          <Route path="members"  element={<MembersPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="setting"  element={<SettingPage />} />
          {/* CMS */}
          <Route path="cms/pages"   element={<PagesPage />} />
          <Route path="cms/banners" element={<BannersPage />} />
          <Route path="cms/popups"  element={<PopupsPage />} />
          <Route path="cms/menus"   element={<MenusPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
