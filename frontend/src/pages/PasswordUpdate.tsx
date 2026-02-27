import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const PasswordUpdate = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/update-password', values);
      message.success(response.data.message || '密码修改成功');
    } catch (error) {
      message.error('密码修改失败，请检查原密码是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="修改密码" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form 
        name="passwordUpdate" 
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          name="currentPassword"
          label="原密码"
          rules={[{ required: true, message: '请输入原密码' }]}
        >
          <Input.Password 
            prefix={<LockOutlined className="site-form-item-icon" />} 
            placeholder="请输入原密码"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少为6位' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined className="site-form-item-icon" />} 
            placeholder="请输入新密码"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          rules={[{ required: true, message: '请确认新密码' }]}
        >
          <Input.Password 
            prefix={<LockOutlined className="site-form-item-icon" />} 
            placeholder="请再次输入新密码"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            确认修改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PasswordUpdate;