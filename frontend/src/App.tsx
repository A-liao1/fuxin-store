import React, { useEffect, useState } from 'react';
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

// 导入移动端页面
import MobileLayout from './pages/mobile/Layout';
import MobileInventory from './pages/mobile/MobileInventory';
import MobileSettlements from './pages/mobile/MobileSettlements';

// 设备检测函数
const isMobile = () => {
  return window.innerWidth < 768;
};

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

// 移动设备检测组件
const DeviceDetector = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  // 如果未登录，跳转到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 检查当前路径是否已经在正确的设备路由上
  const isAlreadyOnMobileRoute = location.pathname.startsWith('/mobile/');
  const isAlreadyOnPcRoute = location.pathname.startsWith('/pc/');

  // 如果已经在正确的路由上，不进行跳转
  if (isAlreadyOnMobileRoute || isAlreadyOnPcRoute) {
    return null;
  }

  // 根据设备类型跳转到相应的页面
  if (isMobile()) {
    return <Navigate to="/mobile/inventory" replace />;
  } else {
    return <Navigate to="/pc/dashboard" replace />;
  }
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
          富兴商贸进销存管理系统
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
              { key: '1', label: '首页', path: '/pc/dashboard' },
              { key: '2', label: '商品管理', path: '/pc/products' },
              { key: '3', label: '供应商管理', path: '/pc/suppliers' },
              { key: '4', label: '客户管理', path: '/pc/customers' },
              { key: '5', label: '采购入库', path: '/pc/purchases' },
              { key: '6', label: '销售出库', path: '/pc/sales' },
              { key: '7', label: '库存管理', path: '/pc/inventory' },
              { key: '8', label: '快递单管理', path: '/pc/express-bills' },
              { key: '9', label: '结算管理', path: '/pc/settlements' },
              { key: '10', label: '修改密码', path: '/pc/password-update' }
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
              <Route path="/" element={<Navigate to="/pc/dashboard" />} />
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
            {/* 移动端路由 */}
            <Route 
              path="/mobile/*" 
              element={
                <ProtectedRoute>
                  <MobileLayout />
                </ProtectedRoute>
              } 
            >
              <Route path="inventory" element={<MobileInventory />} />
              <Route path="settlements" element={<MobileSettlements />} />
              <Route path="*" element={<Navigate to="/mobile/inventory" replace />} />
            </Route>
            {/* PC端路由 */}
            <Route 
              path="/pc/*" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } 
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="customers" element={<Customers />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="sales" element={<Sales />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="express-bills" element={<ExpressBills />} />
              <Route path="settlements" element={<Settlements />} />
              <Route path="password-update" element={<PasswordUpdate />} />
              <Route path="*" element={<Navigate to="/pc/dashboard" replace />} />
            </Route>
            {/* 所有受保护的路由都经过设备检测 */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <DeviceDetector />
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