import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Spin, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { supplierApi } from '../services/api';
import type { Supplier } from '../types';
import '../styles/table.css';

const { Column } = Table;

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  // 加载状态
  const [submitting, setSubmitting] = useState(false);
  // 搜索相关状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    phone: ''
  });

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierApi.getSuppliers();
      let filteredSuppliers = response.data;
      
      // 应用本地筛选
      if (searchParams.name) {
        filteredSuppliers = filteredSuppliers.filter(supplier => 
          supplier.name.toLowerCase().includes(searchParams.name.toLowerCase())
        );
      }
      
      if (searchParams.phone) {
        filteredSuppliers = filteredSuppliers.filter(supplier => 
          supplier.phone?.toLowerCase().includes(searchParams.phone.toLowerCase())
        );
      }
      
      // 按照创建时间或更新时间排序，最新的在前
      filteredSuppliers.sort((a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          // 如果没有时间字段，按照ID排序（假设ID是递增的）
          return b.id.localeCompare(a.id);
        }
      });
      
      setSuppliers(filteredSuppliers);
    } catch (error) {
      message.error('获取供应商列表失败');
      console.error('获取供应商列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 处理搜索
  const handleSearch = async (values: any) => {
    setSearchParams({
      name: values.name || '',
      phone: values.phone || ''
    });
    fetchSuppliers();
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      name: '',
      phone: ''
    });
    fetchSuppliers();
  };

  // 打开添加供应商模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setVisible(true);
  };

  // 打开编辑供应商模态框
  const handleEdit = (record: Supplier) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setVisible(true);
  };

  // 删除供应商
  const handleDelete = async (id: string) => {
    try {
      await supplierApi.deleteSupplier(id);
      message.success('删除供应商成功');
      fetchSuppliers();
    } catch (error) {
      message.error('删除供应商失败');
      console.error('删除供应商失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      if (editingRecord) {
        // 更新供应商
        await supplierApi.updateSupplier(editingRecord.id, values);
        message.success('更新供应商成功');
      } else {
        // 创建供应商
        await supplierApi.createSupplier(values);
        message.success('创建供应商成功');
      }
      
      setVisible(false);
      fetchSuppliers();
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
        <h1>供应商管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加供应商
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
          <Form.Item name="name" label="供应商名称" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入供应商名称"
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
        <div className="table-title">供应商管理</div>
        <Spin spinning={loading}>
          <Table 
            dataSource={suppliers} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            className="custom-table"
          >
            <Column title="供应商名称" dataIndex="name" key="name" />
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
                    title="确定要删除这个供应商吗？" 
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
        title={editingRecord ? '编辑供应商' : '添加供应商'}
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
            label="供应商名称" 
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
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

export default Suppliers;