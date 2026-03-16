import { useState } from 'react';
import { Layout, Menu, Button, Space, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined, HomeOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content, Footer } = Layout;

const MobileLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('inventory');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = (key: string) => {
    setCurrent(key);
    navigate(`/mobile/${key}`);
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ backgroundColor: '#001529', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
          富兴商贸
        </div>
        <Space style={{ color: '#fff' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            style={{ color: '#fff' }} 
            onClick={handleLogout}
          >
            退出
          </Button>
        </Space>
      </Header>
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <Menu
          mode="horizontal"
          selectedKeys={[current]}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ backgroundColor: '#fff' }}
          items={[
            {
              key: 'inventory',
              icon: <HomeOutlined />,
              label: '库存管理',
            },
            {
              key: 'settlements',
              icon: <DollarOutlined />,
              label: '结算管理',
            },
          ]}
        />
      </div>
      <Content style={{ padding: '16px', flex: 1 }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MobileLayout;