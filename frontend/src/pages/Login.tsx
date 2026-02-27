import { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Password } = Input;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const response = await loginApi.login(values.username, values.password);
      if (response.data.success) {
        login(response.data.user, response.data.token);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <Card title="管理员登录" style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <Form
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>



          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%', height: 40, fontSize: 16 }} 
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;