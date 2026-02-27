import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Spin, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { productApi, brandApi } from '../services/api';
import type { Product, Brand } from '../types';
import '../styles/table.css';

const { Column } = Table;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('瓶');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  // 搜索相关状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    brand_id: '',
    unit: ''
  });

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProducts();
      let filteredProducts = response.data;
      
      // 应用本地筛选
      if (searchParams.name) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchParams.name.toLowerCase())
        );
      }
      
      if (searchParams.brand_id) {
        filteredProducts = filteredProducts.filter(product => 
          product.brand_id === searchParams.brand_id
        );
      }
      
      if (searchParams.unit) {
        filteredProducts = filteredProducts.filter(product => 
          product.unit === searchParams.unit
        );
      }
      
      // 按照创建时间或更新时间排序，最新的在前
      filteredProducts.sort((a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          // 如果没有时间字段，按照ID排序（假设ID是递增的）
          return b.id.localeCompare(a.id);
        }
      });
      
      setProducts(filteredProducts);
    } catch (error) {
      message.error('获取商品列表失败');
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取品牌列表
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await brandApi.getBrands();
      setBrands(response.data);
    } catch (error) {
      message.error('获取品牌列表失败');
      console.error('获取品牌列表失败:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, []);

  // 处理搜索
  const handleSearch = async (values: any) => {
    setSearchParams({
      name: values.name || '',
      brand_id: values.brand_id || '',
      unit: values.unit || ''
    });
    fetchProducts();
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      name: '',
      brand_id: '',
      unit: ''
    });
    fetchProducts();
  };

  // 打开添加商品模态框
  const handleAdd = () => {
    setEditingRecord(null);
    setSelectedUnit('瓶');
    setSelectedBrandId('');
    form.setFieldsValue({
      spec: 1,
      unit: '瓶'
    });
    setVisible(true);
  };

  // 打开编辑商品模态框
  const handleEdit = (record: Product) => {
    setEditingRecord(record);
    setSelectedUnit(record.unit || '瓶');
    setSelectedBrandId(record.brand_id || '');
    form.setFieldsValue({
      ...record,
      spec: record.spec || 1
    });
    setVisible(true);
  };

  // 删除商品
  const handleDelete = async (id: string) => {
    try {
      await productApi.deleteProduct(id);
      message.success('删除商品成功');
      fetchProducts();
    } catch (error) {
      message.error('删除商品失败');
      console.error('删除商品失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 验证品牌是否已选择
      if (!selectedBrandId) {
        message.error('请选择品牌');
        return;
      }
      
      const values = await form.validateFields();
      
      // 确保 spec 字段有值，并添加 brand_id 字段
      const productData = {
        ...values,
        brand_id: selectedBrandId,
        spec: values.spec || 1
      };
      
      if (editingRecord) {
        // 更新商品
        await productApi.updateProduct(editingRecord.id, productData);
        message.success('更新商品成功');
      } else {
        // 创建商品
        await productApi.createProduct(productData);
        message.success('创建商品成功');
      }
      
      setVisible(false);
      fetchProducts();
    } catch (error) {
      message.error('操作失败，请检查输入');
      console.error('操作失败:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>商品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加商品
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
          <Form.Item name="name" label="商品名称" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入商品名称"
              style={{ width: 200 }}
            />
          </Form.Item>
          
          <Form.Item name="brand_id" label="品牌" style={{ marginBottom: 0 }}>
            <Select
              placeholder="请选择品牌"
              style={{ width: 200 }}
              allowClear
            >
              {brands.map(brand => (
                <Select.Option key={brand.id} value={brand.id}>{brand.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="unit" label="单位" style={{ marginBottom: 0 }}>
            <Select
              placeholder="请选择单位"
              style={{ width: 100 }}
              allowClear
            >
              <Select.Option value="瓶">瓶</Select.Option>
              <Select.Option value="箱">箱</Select.Option>
            </Select>
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
        <div className="table-title">商品管理</div>
        <Spin spinning={loading}>
          <Table 
            dataSource={products} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            className="custom-table"
          >
            <Column title="商品名称" dataIndex="name" key="name" />
            <Column 
              title="品牌" 
              key="brand" 
              render={(text, record) => record.Brand?.name || '未知品牌'}
            />
            <Column title="规格" dataIndex="spec" key="spec" />
            <Column title="单位" dataIndex="unit" key="unit" />
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
                    title="确定要删除这个商品吗？" 
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
        title={editingRecord ? '编辑商品' : '添加商品'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="商品名称" 
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item 
            label="品牌" 
            rules={[{ required: true, message: '请选择品牌' }]}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Select 
                placeholder="请选择品牌" 
                style={{ flex: 1 }}
                options={brands.map(brand => ({ label: brand.name, value: brand.id }))}
                value={selectedBrandId}
                onChange={(value) => setSelectedBrandId(value)}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={async () => {
                  const newBrandName = prompt('请输入新品牌名称:');
                  if (newBrandName && newBrandName.trim()) {
                    const trimmedBrandName = newBrandName.trim();
                    if (!brands.some(brand => brand.name === trimmedBrandName)) {
                      try {
                        await brandApi.createBrand({ name: trimmedBrandName });
                        message.success('品牌添加成功');
                        fetchBrands(); // 重新获取品牌列表
                      } catch (error) {
                        message.error('品牌添加失败');
                        console.error('品牌添加失败:', error);
                      }
                    } else {
                      message.error('品牌已存在');
                    }
                  }
                }}
              >
                新增
              </Button>
            </div>
          </Form.Item>
          <Form.Item 
            name="unit" 
            label="单位" 
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Select 
              placeholder="请选择单位" 
              style={{ width: '100%' }}
              options={[
                { label: '瓶', value: '瓶' },
                { label: '箱', value: '箱' }
              ]}
              onChange={(value) => {
                setSelectedUnit(value);
                // 当单位为瓶时，规格数量默认为1
                if (value === '瓶') {
                  form.setFieldsValue({ spec: 1 });
                }
              }}
            />
          </Form.Item>
          {selectedUnit === '箱' && (
            <Form.Item 
              name="spec" 
              label="规格数量" 
              rules={[{ required: true, message: '请输入规格数量' }]}
            >
              <Select 
                placeholder="请选择规格数量" 
                style={{ width: '100%' }}
                options={Array.from({ length: 20 }, (_, i) => ({
                  label: `${i + 1}`,
                  value: i + 1
                }))}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Products;