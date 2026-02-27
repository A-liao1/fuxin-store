import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Spin, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { customerApi } from '../services/api';
import type { Customer } from '../types';
import '../styles/table.css';

const { Column } = Table;

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  // 加载状态
  const [submitting, setSubmitting] = useState(false);
  // 搜索相关状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    phone: ''
  });

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCustomers();
      let filteredCustomers = response.data;
      
      // 应用本地筛选
      if (searchParams.name) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.name.toLowerCase().includes(searchParams.name.toLowerCase())
        );
      }
      
      if (searchParams.phone) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.phone?.toLowerCase().includes(searchParams.phone.toLowerCase())
        );
      }
      
      // 按照创建时间或更新时间排序，最新的在前
      filteredCustomers.sort((a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          // 如果没有时间字段，按照ID排序（假设ID是递增的）
          return b.id.localeCompare(a.id);
        }
      });
      
      setCustomers(filteredCustomers);
    } catch (error) {
      message.error('获取客户列表失败');
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 处理搜索
  const handleSearch = async (values: any) => {
    setSearchParams({
      name: values.name || '',
      phone: values.phone || ''
    });
    fetchCustomers();
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      name: '',
      phone: ''
    });
    fetchCustomers();
  };

  // 打开添加客户模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setVisible(true);
  };

  // 打开编辑客户模态框
  const handleEdit = (record: Customer) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setVisible(true);
  };

  // 删除客户
  const handleDelete = async (id: string) => {
    try {
      await customerApi.deleteCustomer(id);
      message.success('删除客户成功');
      fetchCustomers();
    } catch (error) {
      message.error('删除客户失败');
      console.error('删除客户失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      if (editingRecord) {
        // 更新客户
        await customerApi.updateCustomer(editingRecord.id, values);
        message.success('更新客户成功');
      } else {
        // 创建客户
        await customerApi.createCustomer(values);
        message.success('创建客户成功');
      }
      
      setVisible(false);
      fetchCustomers();
    } catch (error) {
      message.error('操作失败，请检查输入');
      console.error('操作失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>客户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加客户
        </Button>
      </div>
      
      {/* 搜索表单 */}
      <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ width: '100%' }}
        >
          <Form.Item name="name" label="客户名称" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入客户名称"
              style={{ width: 200 }}
            />
          </Form.Item>
          
          <Form.Item name="phone" label="联系电话" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入联系电话"
              style={{ width: 200 }}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
              搜索
            </Button>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </div>
      
      <div className="table-container">
        <div className="table-title">客户管理</div>
        <Spin spinning={loading}>
          <Table 
            dataSource={customers} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            className="custom-table"
          >
            <Column title="客户名称" dataIndex="name" key="name" />
            <Column title="客户类型" dataIndex="type" key="type" />
            <Column title="联系电话" dataIndex="phone" key="phone" />
            <Column 
              title="操作" 
              key="action" 
              render={(_, record) => (
                <div>
                  <Button 
                    icon={<EditOutlined />} 
                    style={{ marginRight: 8 }} 
                    onClick={() => handleEdit(record)}
                  />
                  <Popconfirm 
                    title="确定要删除这个客户吗？" 
                    onConfirm={() => handleDelete(record.id)}
                    okText="确定" 
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              )} 
            />
          </Table>
        </Spin>
      </div>

      <Modal
        title={editingRecord ? '编辑客户' : '添加客户'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="客户名称" 
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item 
            name="phone" 
            label="联系电话" 
            rules={[]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;