import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Spin, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { expressBillApi, productApi, supplierApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Supplier } from '../types';
import '../styles/table.css';

const { Column } = Table;
const { TextArea } = Input;

const ExpressBills = () => {
  const { user } = useAuth();
  const [expressBills, setExpressBills] = useState<any[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [convertVisible, setConvertVisible] = useState(false);
  const [currentExpressBill, setCurrentExpressBill] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [convertForm] = Form.useForm();
  const [supplierForm] = Form.useForm();
  const [items, setItems] = useState<{ product_id: string; quantity: number; price: number; subtotal: number }[]>([]);
  // 加载状态
  const [submitting, setSubmitting] = useState(false);
  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  // 获取快递单列表
  const fetchExpressBills = async (expressCode?: string, supplierName?: string, status?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (expressCode) params.expressCode = expressCode;
      if (supplierName) params.supplierName = supplierName;
      if (status) params.status = status;
      const response = await expressBillApi.getExpressBills(params);
      setExpressBills(response.data);
    } catch (error) {
      message.error('获取快递单列表失败');
      console.error('获取快递单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };



  // 获取商品列表
  const fetchProducts = async () => {
    try {
      const response = await productApi.getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('获取商品列表失败:', error);
    }
  };

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await supplierApi.getSuppliers();
      // 按照创建时间倒序排序，新创建的供应商排在前面
      const sortedSuppliers = response.data.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setSuppliers(sortedSuppliers);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  useEffect(() => {
    fetchExpressBills();
    fetchProducts();
    fetchSuppliers();
  }, []);

  // 打开添加快递单模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setItems([]);
    setVisible(true);
  };

  // 打开编辑快递单模态框
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      express_code: record.express_code,
      supplier_id: record.supplier_id,
      remark: record.remark
    });
    // 设置快递单明细
    setItems(record.ExpressBillItems?.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    })) || []);
    setVisible(true);
  };

  // 打开查看快递单模态框
  const handleView = (record: any) => {
    setCurrentExpressBill(record);
    setViewVisible(true);
  };

  // 打开转入库单模态框
  const handleConvertToPurchase = (record: any) => {
    setCurrentExpressBill(record);
    convertForm.resetFields();
    
    // 准备表单字段值
    const formValues: any = {};
    
    // 如果快递单有选择供应商，自动填充供应商字段
    if (record.supplier_id) {
      formValues.supplier_id = record.supplier_id;
    }
    
    // 为每个商品设置价格字段值
    if (record.ExpressBillItems) {
      record.ExpressBillItems.forEach((item: any) => {
        formValues[`price_${item.product_id}`] = item.price || 0;
      });
    }
    
    // 设置表单字段值
    convertForm.setFieldsValue(formValues);
    setConvertVisible(true);
  };

  // 打开添加供应商模态框
  const handleOpenAddSupplierModal = () => {
    supplierForm.resetFields();
    setSupplierModalVisible(true);
  };

  // 处理添加供应商
  const handleAddSupplier = async () => {
    try {
      setSupplierSubmitting(true);
      const values = await supplierForm.validateFields();
      
      // 创建新供应商
      const response = await supplierApi.createSupplier({
        name: values.name
      });
      
      message.success('供应商添加成功');
      setSupplierModalVisible(false);
      
      // 重新获取供应商列表
      fetchSuppliers();
      
      // 自动选择新添加的供应商
      form.setFieldsValue({
        supplier_id: response.data.id
      });
    } catch (error) {
      message.error('添加供应商失败');
      console.error('添加供应商失败:', error);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  // 删除快递单
  const handleDelete = async (id: string) => {
    try {
      await expressBillApi.deleteExpressBill(id);
      message.success('删除快递单成功');
      fetchExpressBills();
    } catch (error) {
      message.error('删除快递单失败');
      console.error('删除快递单失败:', error);
    }
  };

  // 添加快递单明细
  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, price: 0, subtotal: 0 }]);
  };

  // 删除快递单明细
  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 更新快递单明细
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // 计算小计
    if (field === 'quantity' || field === 'price' || field === 'product_id') {
      const product = products.find(p => p.id === newItems[index].product_id);
      const spec = product?.spec || 1;
      newItems[index].subtotal = Number(newItems[index].price) * Number(newItems[index].quantity) * spec;
    }
    
    setItems(newItems);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      // 检查是否添加了商品
      if (items.length === 0) {
        message.error('请添加商品');
        return;
      }
      
      const expressBillData = {
        express_code: values.express_code,
        supplier_id: values.supplier_id,
        items: items,
        operator: user?.name || user?.username || '当前用户',
        remark: values.remark
      };
      
      if (editingRecord) {
        // 更新快递单
        await expressBillApi.updateExpressBill(editingRecord.id, expressBillData);
        message.success('更新快递单成功');
      } else {
        // 创建快递单
        await expressBillApi.createExpressBill(expressBillData);
        message.success('创建快递单成功');
      }
      
      setVisible(false);
      fetchExpressBills();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败，请检查输入');
      console.error('操作失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 处理转入库单
  const handleConvertSubmit = async () => {
    try {
      setConvertSubmitting(true);
      const values = await convertForm.validateFields();
      
      // 准备采购价格数据
      const purchasePrice: any = {};
      currentExpressBill.ExpressBillItems.forEach((item: any) => {
        purchasePrice[item.product_id] = values[`price_${item.product_id}`] || item.price || 0;
      });
      
      const response = await expressBillApi.convertToPurchase(currentExpressBill.id, {
        supplier_id: values.supplier_id,
        purchase_price: purchasePrice,
        operator: user?.name || user?.username || '当前用户'
      });
      
      console.log('转换响应数据:', response);
      console.log('转换响应数据.data:', response.data);
      console.log('转换响应数据.data.expressBill:', response.data.expressBill);
      
      message.success('转换为入库单成功');
      setConvertVisible(false);
      fetchExpressBills();
      
      // 使用返回的更新后的快递单数据来更新详情页面
      if (viewVisible && response.data.expressBill) {
        console.log('使用返回的快递单数据更新详情');
        setCurrentExpressBill(response.data.expressBill);
      } else if (viewVisible && currentExpressBill) {
        // 后备方案：如果返回数据中没有快递单信息，重新获取
        console.log('使用后备方案重新获取快递单数据');
        expressBillApi.getExpressBill(currentExpressBill.id).then(resp => {
          console.log('重新获取的快递单数据:', resp.data);
          setCurrentExpressBill(resp.data);
        }).catch(error => {
          console.error('获取快递单详情失败:', error);
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '转换失败，请检查输入');
      console.error('转换失败:', error);
    } finally {
      setConvertSubmitting(false);
    }
  };

  // 处理搜索
  const handleSearch = async (values: any) => {
    fetchExpressBills(values.expressCode, values.supplierName, values.status);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    fetchExpressBills();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>快递单管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加快递单
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
          <Form.Item name="expressCode" label="快递单号" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入快递单号"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="supplierName" label="供应商" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入供应商名称"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="status" label="状态" style={{ marginBottom: 0 }}>
            <Select
              placeholder="请选择状态"
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="待处理">待处理</Select.Option>
              <Select.Option value="已入库">已入库</Select.Option>
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
      
      <Spin spinning={loading}>
        <div className="table-container">
          <div className="table-title">快递单列表</div>
          {expressBills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
              <p>暂无快递单数据</p>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginTop: 16 }}>
                添加快递单
              </Button>
            </div>
          ) : (
            <Table 
              dataSource={expressBills} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
              className="custom-table"
              onRow={(record) => ({
                onDoubleClick: () => handleView(record)
              })}
            >
              <Column 
                title="快递单号" 
                dataIndex="express_code" 
                key="express_code" 
                ellipsis 
                sorter={(a, b) => a.express_code.localeCompare(b.express_code)}
                render={(express_code) => (
                  <span 
                    style={{ 
                      cursor: 'pointer', 
                      color: '#1890ff', 
                      padding: '2px 8px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: 4, 
                      display: 'inline-block' 
                    }} 
                    onClick={() => {
                      navigator.clipboard.writeText(express_code);
                      message.success('快递单号已复制到剪贴板');
                    }}
                  >
                    {express_code} <span style={{ fontSize: '12px', marginLeft: 4 }}>复制</span>
                  </span>
                )}
              />
              <Column 
                title="供应商" 
                dataIndex="Supplier" 
                key="supplier" 
                render={(supplier) => supplier?.name || '-'} 
              />
              <Column 
                title="状态" 
                dataIndex="status" 
                key="status" 
                filters={[
                  { text: '待处理', value: '待处理' },
                  { text: '已入库', value: '已入库' }
                ]}
                onFilter={(value, record) => record.status === value}
              />
              <Column title="操作人" dataIndex="operator" key="operator" />
              <Column title="备注" dataIndex="remark" key="remark" render={(text) => text || '-'} />
              <Column 
                title="创建时间" 
                dataIndex="createdAt" 
                key="createdAt" 
                render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')} 
                sorter={(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()}
                defaultSortOrder="descend"
              />
              <Column 
                title="操作" 
                key="action" 
                fixed="right"
                render={(_, record) => (
                  <Space size="small">
                    <Button 
                      icon={<EyeOutlined />} 
                      size="small"
                      onClick={() => handleView(record)}
                      title="查看"
                    />
                    <Button 
                      icon={<EditOutlined />} 
                      size="small"
                      onClick={() => handleEdit(record)}
                      title="编辑"
                    />
                    {record.status === '待处理' && (
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleConvertToPurchase(record)}
                        title="转入库单"
                      >
                        转入库单
                      </Button>
                    )}
                    <Popconfirm 
                      title="确定要删除这个快递单吗？" 
                      onConfirm={() => handleDelete(record.id)}
                      okText="确定" 
                      cancelText="取消"
                    >
                      <Button danger icon={<DeleteOutlined />} size="small" title="删除" />
                    </Popconfirm>
                  </Space>
                )} 
              />
            </Table>
          )}
        </div>
      </Spin>

      {/* 添加/编辑快递单模态框 */}
      <Modal
        title={editingRecord ? '编辑快递单' : '添加快递单'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="express_code" 
            label="快递单号" 
            rules={[{ required: true, message: '请输入快递单号' }]}
          >
            <Input placeholder="请输入或扫描快递单号" />
          </Form.Item>
          <Form.Item 
            name="supplier_id" 
            label="供应商"
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Select 
                placeholder="请选择供应商" 
                style={{ flex: 1 }}
                showSearch
                optionFilterProp="children"
                autoClearSearchValue={false}
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
              >
                {suppliers.map(supplier => (
                  <Select.Option key={supplier.id} value={supplier.id}>{supplier.name}</Select.Option>
                ))}
              </Select>
              <Button type="primary" onClick={handleOpenAddSupplierModal}>添加</Button>
            </div>
          </Form.Item>
          <Form.Item 
            name="remark" 
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          
          <h3 style={{ marginTop: 24, marginBottom: 16 }}>快递单明细</h3>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddItem} style={{ marginBottom: 16 }}>
            添加商品
          </Button>
          
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
              <Form.Item 
                label="商品" 
                style={{ flex: 2 }}
                rules={[{ required: true, message: '请选择商品' }]}
              >
                <Select 
                  placeholder="请选择商品" 
                  value={item.product_id || undefined}
                  onChange={(value) => handleItemChange(index, 'product_id', value)}
                  showSearch
                  optionFilterProp="children"
                  autoClearSearchValue={false}
                  getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                  style={{ width: '100%' }}
                >
                  {products.map(product => (
                    <Select.Option key={product.id} value={product.id}>{product.name} ({product.spec})</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item 
                label="数量" 
                style={{ flex: 1 }}
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={item.quantity}
                  onChange={(value) => handleItemChange(index, 'quantity', value)}
                  min={1}
                />
              </Form.Item>
              <Form.Item 
                label="价格" 
                style={{ flex: 1 }}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={item.price}
                  onChange={(value) => handleItemChange(index, 'price', value)}
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
              <Form.Item 
                label="小计" 
                style={{ flex: 1 }}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={item.subtotal}
                  disabled
                  formatter={(value) => `¥${Number(value).toFixed(2)}`}
                />
              </Form.Item>
              <Form.Item style={{ flex: 0, marginTop: 24 }}>
                <Button danger onClick={() => handleDeleteItem(index)}>
                  <DeleteOutlined />
                </Button>
              </Form.Item>
            </div>
          ))}
        </Form>
      </Modal>

      {/* 查看快递单模态框 */}
      <Modal
        title="快递单详情"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewVisible(false)}>关闭</Button>
        ]}
        width={900}
      >
        {currentExpressBill && (
          <div>
            {/* 顶部信息 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>快递单详情</h2>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}><strong>快递单号</strong></span>
                    <span 
                      style={{ 
                        cursor: 'pointer', 
                        color: '#1890ff', 
                        padding: '2px 8px', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: 4, 
                        display: 'inline-block' 
                      }} 
                      onClick={() => {
                        navigator.clipboard.writeText(currentExpressBill.express_code);
                        message.success('快递单号已复制到剪贴板');
                      }}
                    >
                      {currentExpressBill.express_code} <span style={{ fontSize: '12px', marginLeft: 4 }}>复制</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}><strong>状态</strong></span>
                    <span 
                      style={{ 
                        padding: '2px 12px', 
                        borderRadius: 12, 
                        textAlign: 'center', 
                        display: 'inline-block',
                        backgroundColor: currentExpressBill.status === '待处理' ? '#fffbe6' : '#f6ffed',
                        color: currentExpressBill.status === '待处理' ? '#faad14' : '#52c41a',
                        border: currentExpressBill.status === '待处理' ? '1px solid #ffe58f' : '1px solid #b7eb8f'
                      }}
                    >
                      {currentExpressBill.status}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 基本信息 */}
              <div style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  <div>
                    <strong>供应商</strong> {currentExpressBill.Supplier?.name || '-'}
                  </div>
                  <div>
                    <strong>操作人</strong> {currentExpressBill.operator}
                  </div>
                  <div>
                    <strong>创建时间</strong> {dayjs(currentExpressBill.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                  {currentExpressBill.purchase_id && (
                    <div>
                      <strong>关联入库单</strong> {currentExpressBill.Purchase?.id}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <strong>备注</strong> {currentExpressBill.remark || '-'}
                </div>
              </div>
            </div>
            
            {/* 商品明细表格 */}
            <div className="table-container" style={{ marginBottom: 24 }}>
              <div className="table-title">商品明细</div>
              <Table 
                dataSource={currentExpressBill.ExpressBillItems || []} 
                rowKey="id" 
                pagination={false}
                className="custom-table"
              >
                <Column 
                  title="商品名称" 
                  dataIndex="Product" 
                  key="product" 
                  render={(product) => product?.name || ''} 
                  width={200}
                />
                <Column 
                  title="规格" 
                  dataIndex="Product" 
                  key="spec" 
                  render={(product) => product?.spec || ''} 
                  width={100}
                />
                <Column 
                  title="数量" 
                  dataIndex="quantity" 
                  key="quantity" 
                  width={100}
                  align="center"
                />
                <Column 
                  title="价格" 
                  dataIndex="price" 
                  key="price" 
                  render={(price) => `¥${Number(price).toFixed(2)}`} 
                  width={100}
                  align="center"
                />
                <Column 
                  title="小计" 
                  dataIndex="subtotal" 
                  key="subtotal" 
                  render={(subtotal) => `¥${Number(subtotal).toFixed(2)}`} 
                  width={100}
                  align="center"
                />
              </Table>
            </div>
          </div>
        )}
      </Modal>

      {/* 转入库单模态框 */}
      <Modal
        title="转入库单"
        open={convertVisible}
        onOk={handleConvertSubmit}
        onCancel={() => setConvertVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
        confirmLoading={convertSubmitting}
      >
        {currentExpressBill && (
          <Form form={convertForm} layout="vertical">
            <Form.Item 
              name="supplier_id" 
              label="供应商" 
              rules={[{ required: true, message: '请选择供应商' }]}
            >
              <Select 
                placeholder="请选择供应商" 
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
                autoClearSearchValue={false}
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
              >
                {suppliers.map(supplier => (
                  <Select.Option key={supplier.id} value={supplier.id}>{supplier.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <h3 style={{ marginTop: 24, marginBottom: 16 }}>商品采购价格</h3>
            {currentExpressBill.ExpressBillItems?.map((item: any) => (
              <Form.Item 
                key={item.product_id}
                name={`price_${item.product_id}`} 
                label={`${item.Product?.name} (${item.Product?.spec}) - 数量: ${item.quantity}`}
                rules={[{ required: true, message: '请输入采购价格' }, { type: 'number', min: { value: 0.01, message: '采购价格必须大于0' } }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="请输入采购价格"
                  min={0.01}
                  step={0.01}
                  precision={2}
                  defaultValue={item.price || 0}
                />
              </Form.Item>
            ))}
          </Form>
        )}
      </Modal>

      {/* 添加供应商模态框 */}
      <Modal
        title="添加供应商"
        open={supplierModalVisible}
        onOk={handleAddSupplier}
        onCancel={() => setSupplierModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={400}
        confirmLoading={supplierSubmitting}
      >
        <Form form={supplierForm} layout="vertical">
          <Form.Item 
            name="name" 
            label="供应商名称" 
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default ExpressBills;