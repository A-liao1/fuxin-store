import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Button, Space, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// 导入页面组件
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import InventoryPage from './pages/Inventory';
import Settlements from './pages/Settlements';
import ExpressBills from './pages/ExpressBills';
import Login from './pages/Login';
import PasswordUpdate from './pages/PasswordUpdate';

const { Header, Content, Sider } = Layout;

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // 在加载状态时，显示加载中
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ fontSize: '18px', color: '#1890ff' }}>加载中...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// 主应用布局组件
const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ backgroundColor: '#001529', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo" style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          酒水小店进销存管理系统
        </div>
        <Space style={{ color: '#fff' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <span style={{ marginRight: 16 }}>{user?.username || '管理员'}</span>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            style={{ color: '#fff' }} 
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ backgroundColor: '#001529' }}>
          <Menu
            mode="inline"
            theme="dark"
            style={{ height: '100%', borderRight: 0 }}
            items={[
              { key: '1', label: '首页', path: '/dashboard' },
              { key: '2', label: '商品管理', path: '/products' },
              { key: '3', label: '供应商管理', path: '/suppliers' },
              { key: '4', label: '客户管理', path: '/customers' },
              { key: '5', label: '采购入库', path: '/purchases' },
              { key: '6', label: '销售出库', path: '/sales' },
              { key: '7', label: '库存管理', path: '/inventory' },
              { key: '8', label: '快递单管理', path: '/express-bills' },
              { key: '9', label: '结算管理', path: '/settlements' },
              { key: '10', label: '修改密码', path: '/password-update' }
            ].map(item => ({
              key: item.key,
              label: <Link to={item.path}>{item.label}</Link>
            }))}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/express-bills" element={<ExpressBills />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/password-update" element={<PasswordUpdate />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;