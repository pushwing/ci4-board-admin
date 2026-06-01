import { Layout, Menu, Button, App } from 'antd'
import {
  FileTextOutlined,
  PictureOutlined,
  NotificationOutlined,
  MenuOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { adminLogout } from '../api/cms'

const { Sider, Content, Header } = Layout

const menuItems = [
  { key: '/cms/pages',   icon: <FileTextOutlined />,     label: '페이지 관리' },
  { key: '/cms/banners', icon: <PictureOutlined />,      label: '배너 관리' },
  { key: '/cms/popups',  icon: <NotificationOutlined />, label: '팝업 관리' },
  { key: '/cms/menus',   icon: <MenuOutlined />,         label: '메뉴 관리' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearAuth } = useAuthStore()
  const { message } = App.useApp()

  const handleLogout = async () => {
    try { await adminLogout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
    message.success('로그아웃 되었습니다.')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ padding: '16px 24px', color: '#fff', fontWeight: 700, fontSize: 16 }}>
          CI4 Board Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid #f0f0f0' }}>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
            로그아웃
          </Button>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 400 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
