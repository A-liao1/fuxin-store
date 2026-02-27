import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Spin, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { purchaseApi, supplierApi, productApi, inventoryApi, brandApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Purchase, Supplier, Product, Inventory } from '../types';
import '../styles/table.css';

const { Column } = Table;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Purchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);
  const [editingRecord, setEditingRecord] = useState<Purchase | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [items, setItems] = useState<{ product_id: string; product_spec: number; quantity: number; price: number; subtotal: number }[]>([]);
  // 供应商添加相关状态
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [supplierForm] = Form.useForm();
  // 加载状态
  const [submitting, setSubmitting] = useState(false);
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  // 获取采购单列表
  const fetchPurchases = async (supplierName?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (supplierName) {
        params.supplierName = supplierName;
      }
      const response = await purchaseApi.getPurchases(params);
      
      // 按照日期排序，最新的在前
      const sortedPurchases = response.data.sort((a, b) => {
        return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      });
      
      setPurchases(sortedPurchases);
    } catch (error) {
      message.error('获取采购单列表失败');
      console.error('获取采购单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = async (values: any) => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (values.supplierName) {
        params.supplierName = values.supplierName;
      }
      
      if (values.expressBillCode) {
        params.expressBillCode = values.expressBillCode;
      }
      
      if (values.totalAmount) {
        params.totalAmount = values.totalAmount;
      }
      
      if (values.settlementStatus) {
        params.settlementStatus = values.settlementStatus;
      }
      
      const response = await purchaseApi.getPurchases(params);
      let filteredPurchases = response.data;
      
      // 应用日期筛选（前端）
      if (values.dateRange && values.dateRange[0]) {
        filteredPurchases = filteredPurchases.filter(purchase => {
          return dayjs(purchase.date).isAfter(dayjs(values.dateRange[0]).startOf('day'));
        });
      }
      
      if (values.dateRange && values.dateRange[1]) {
        filteredPurchases = filteredPurchases.filter(purchase => {
          return dayjs(purchase.date).isBefore(dayjs(values.dateRange[1]).endOf('day'));
        });
      }
      
      // 按照日期排序，最新的在前
      filteredPurchases.sort((a, b) => {
        return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      });
      
      setPurchases(filteredPurchases);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    fetchPurchases();
  };

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await supplierApi.getSuppliers();
      // 按创建时间倒序排序，新创建的排在前面
      const sortedSuppliers = response.data.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (a.createdAt) {
          return -1;
        } else if (b.createdAt) {
          return 1;
        } else {
          return 0;
        }
      });
      setSuppliers(sortedSuppliers);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
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

  // 获取品牌列表
  const fetchBrands = async () => {
    try {
      const response = await brandApi.getBrands();
      setBrands(response.data);
    } catch (error) {
      console.error('获取品牌列表失败:', error);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
    fetchBrands();
  }, []);

  // 打开添加采购单模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setItems([]);
    // 设置默认值
    form.setFieldsValue({
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: user?.name || user?.username || '当前用户'
    });
    setVisible(true);
  };

  // 打开编辑采购单模态框
  const handleEdit = (record: Purchase) => {
    setEditingRecord(record);
    form.setFieldsValue({
      supplier_id: record.supplier_id,
      date: dayjs(record.date).format('YYYY-MM-DD HH:mm:ss'),
      operator: record.operator,
      remark: record.remark
    });
    // 设置采购明细
    setItems(record.PurchaseItems?.map(item => ({
      product_id: item.product_id,
      product_spec: item.Product?.spec || 0,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    })) || []);
    setVisible(true);
  };

  // 打开查看采购单模态框
  const handleView = (record: Purchase) => {
    setCurrentPurchase(record);
    setViewVisible(true);
  };

  // 删除采购单
  const handleDelete = async (id: string) => {
    try {
      await purchaseApi.deletePurchase(id);
      message.success('删除采购单成功');
      fetchPurchases();
    } catch (error) {
      message.error('删除采购单失败');
      console.error('删除采购单失败:', error);
    }
  };

  // 打开添加供应商弹窗
  const handleOpenSupplierModal = () => {
    supplierForm.resetFields();
    setSupplierModalVisible(true);
  };

  // 关闭添加供应商弹窗
  const handleCloseSupplierModal = () => {
    setSupplierModalVisible(false);
  };

  // 保存新供应商
  const handleSaveSupplier = async () => {
    try {
      setSupplierSubmitting(true);
      const values = await supplierForm.validateFields();
      await supplierApi.createSupplier({ 
        name: values.name,
        contact: '',
        phone: ''
      });
      message.success('添加供应商成功');
      setSupplierModalVisible(false);
      fetchSuppliers(); // 重新获取供应商列表
    } catch (error) {
      message.error('添加供应商失败');
      console.error('添加供应商失败:', error);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  // 添加采购明细
  const handleAddItem = () => {
    setItems([...items, { product_id: '', product_spec: 0, quantity: 1, price: 0, subtotal: 0 }]);
  };

  // 删除采购明细
  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 更新采购明细
  const handleItemChange = (index: number, field: 'product_id' | 'quantity' | 'price', value: string | number) => {
    const newItems = [...items];
    if (field === 'product_id') {
      newItems[index][field] = value as string;
    } else {
      newItems[index][field] = value as number;
    }
    
    // 当商品改变时，更新规格并重新计算
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].product_spec = selectedProduct.spec || 0;
      }
    }
    
    // 计算小计：单价 * 规格 * 数量
    newItems[index].subtotal = Number(newItems[index].price) * Number(newItems[index].product_spec) * Number(newItems[index].quantity);
    
    setItems(newItems);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      // 计算总金额
      const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      const purchaseData = {
        ...values,
        date: dayjs(values.date).format('YYYY-MM-DD HH:mm:ss'),
        items,
        total_amount
      };
      
      if (editingRecord) {
        // 更新采购单
        await purchaseApi.updatePurchase(editingRecord.id, purchaseData);
        message.success('更新采购单成功');
      } else {
        // 创建采购单
        await purchaseApi.createPurchase(purchaseData);
        message.success('创建采购单成功');
      }
      
      setVisible(false);
      fetchPurchases();
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
        <h1>采购入库管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加采购单
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
          <Form.Item name="supplierName" label="供应商名称" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入供应商名称"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="expressBillCode" label="快递单号" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入快递单号"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="totalAmount" label="总金额" style={{ marginBottom: 0 }}>
            <InputNumber
              placeholder="请输入总金额"
              style={{ width: 150 }}
              min={0}
              step={0.01}
              precision={2}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="settlementStatus" label="结算状态" style={{ marginBottom: 0 }}>
            <Select
              placeholder="请选择结算状态"
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="未结">未结</Select.Option>
              <Select.Option value="已结">已结</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" label="入库日期" style={{ marginBottom: 0 }}>
            <RangePicker
              style={{ width: 300 }}
              placeholder={['开始日期', '结束日期']}
              showTime={{ format: 'HH:mm:ss' }}
              format="YYYY-MM-DD HH:mm:ss"
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
        <div className="table-title">采购入库单</div>
        <Spin spinning={loading}>
          <Table 
            dataSource={purchases} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            className="custom-table"
          >
            <Column title="入库单号" dataIndex="id" key="id" ellipsis />
            <Column title="快递单号" dataIndex="express_bill_code" key="express_bill_code" ellipsis render={(text) => text || '-'}/>
            <Column 
              title="供应商" 
              dataIndex="Supplier" 
              key="supplier" 
              render={(supplier) => supplier?.name || ''} 
            />
            <Column 
              title="入库日期" 
              dataIndex="date" 
              key="date" 
              render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
            />
            <Column title="总金额" dataIndex="total_amount" key="total_amount" render={(text) => `¥${text}`} />
            <Column title="结算状态" dataIndex="settlement_status" key="settlement_status" />
            <Column title="经手人" dataIndex="operator" key="operator" />
            <Column title="备注" dataIndex="remark" key="remark" render={(text) => text || '-'} />
            <Column 
              title="操作" 
              key="action" 
              render={(_, record: any) => (
                <div>
                  <Button 
                    icon={<EyeOutlined />} 
                    style={{ marginRight: 8 }} 
                    onClick={() => handleView(record as Purchase)}
                  />
                  <Button 
                    icon={<EditOutlined />} 
                    style={{ marginRight: 8 }} 
                    onClick={() => handleEdit(record as Purchase)}
                  />
                  <Popconfirm 
                    title="确定要删除这个采购单吗？" 
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

      {/* 添加/编辑采购单模态框 */}
      <Modal
        title={editingRecord ? '编辑采购单' : '添加采购单'}
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
            name="supplier_id" 
            label="供应商" 
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select 
              placeholder="请选择供应商" 
              style={{ width: 'calc(100% - 80px)' }} 
              suffixIcon={
                <Button type="primary" onClick={handleOpenSupplierModal} style={{ marginLeft: 8 }}>
                  添加
                </Button>
              }
              showSearch
              filterOption={(input: string, option: any) => {
                if (!option) return false;
                const optionText = option.children || '';
                const text = String(optionText);
                return text.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {suppliers.map(supplier => (
                <Select.Option key={supplier.id} value={supplier.id}>{supplier.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
            name="date" 
            label="入库日期" 
            rules={[{ required: true, message: '请选择入库日期' }]}
          >
            <Input 
              style={{ width: '100%' }} 
              readOnly
            />
          </Form.Item>
          <Form.Item 
            name="operator" 
            label="经手人" 
            rules={[{ required: true, message: '请输入经手人' }]}
          >
            <Input placeholder="请输入经手人" />
          </Form.Item>
          <Form.Item 
            name="remark" 
            label="备注" 
          >
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          
          <h3 style={{ marginTop: 24, marginBottom: 16 }}>采购明细</h3>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddItem} style={{ marginBottom: 16 }}>
            添加商品
          </Button>
          

          
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
              <Form.Item 
                label="商品" 
                style={{ flex: 2, marginBottom: 0 }}
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
                  filterOption={(input: string, option: any) => {
                    if (!option) return false;
                    const optionText = option.children || '';
                    const text = String(optionText);
                    return text.toLowerCase().includes(input.toLowerCase());
                  }}
                  style={{ width: '100%' }}
                >
                  {brands.map(brand => (
                    <Select.OptGroup key={brand.id} label={brand.name}>
                      {products
                        .filter(product => product.brand_id === brand.id)
                        .map(product => (
                          <Select.Option key={product.id} value={product.id}>{product.name} ({product.spec})</Select.Option>
                        ))}
                    </Select.OptGroup>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item 
                label="数量" 
                style={{ flex: 1, marginBottom: 0 }}
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={item.quantity}
                  onChange={(value) => handleItemChange(index, 'quantity', value || 0)}
                  min={1}
                />
              </Form.Item>
              <Form.Item 
                label="单价" 
                style={{ flex: 1, marginBottom: 0 }}
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={item.price}
                  onChange={(value) => handleItemChange(index, 'price', value || 0)}
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
              {/* 计算字段显示 */}
              <Form.Item 
                label="计算" 
                style={{ flex: 1, marginBottom: 0 }}
              >
                <div style={{ padding: '4px 11px', height: '32px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#fafafa', textAlign: 'center', lineHeight: '24px', fontSize: 14, fontWeight: 'bold', color: '#ff4d4f' }}>
                  {Number(item.price).toFixed(2)} * {Number(item.product_spec)} * {Number(item.quantity)}
                </div>
              </Form.Item>
              <Form.Item 
                label="小计" 
                style={{ flex: 1, marginBottom: 0 }}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={item.subtotal}
                  disabled
                  formatter={(value) => `¥${Number(value).toFixed(2)}`}
                />
              </Form.Item>
              <Form.Item style={{ flex: 0, marginBottom: 0 }}>
                <Button danger onClick={() => handleDeleteItem(index)}>
                  <DeleteOutlined />
                </Button>
              </Form.Item>
            </div>
          ))}
        </Form>
      </Modal>

      {/* 查看采购单模态框 */}
      <Modal
        title="采购入库单"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewVisible(false)}>关闭</Button>
        ]}
        width={900}
      >
        {currentPurchase && (
          <div>
            {/* 顶部信息 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>采购入库单</h2>
              <div style={{ textAlign: 'right' }}>
                <p><strong>录单日期</strong> {dayjs(currentPurchase.date).format('YYYY-MM-DD')}</p>
              </div>
            </div>
            
            {/* 基本信息 */}
            <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <strong>供应商 *</strong> {currentPurchase.Supplier?.name || ''}
                </div>
                <div>
                  <strong>经手人 *</strong> {currentPurchase.operator}
                </div>
                <div>
                  <strong>结算状态</strong> 
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: currentPurchase.settlement_status === '已结' ? '#52c41a' : '#fa541c',
                    color: 'white',
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}>
                    {currentPurchase.settlement_status}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <strong>摘要</strong> {currentPurchase.remark || ''}
              </div>
            </div>
            
            {/* 商品明细表格 */}
            <div className="table-container" style={{ marginBottom: 24 }}>
              {currentPurchase.PurchaseItems && (
                <Table 
                  dataSource={[
                    ...currentPurchase.PurchaseItems,
                    {
                      id: 'total',
                      isTotal: true,
                      quantity: currentPurchase.PurchaseItems.reduce((sum, item) => sum + item.quantity, 0),
                      subtotal: currentPurchase.total_amount
                    }
                  ]} 
                  rowKey="id" 
                  pagination={false}
                  className="custom-table"
                >
                  <Column 
                    title="商品名称" 
                    dataIndex="Product" 
                    key="product" 
                    render={(product, record) => record.isTotal ? '合计' : (product?.name || '')} 
                    width={200}
                    onCell={(record) => ({
                      style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {}
                    })}
                  />
                  <Column 
                    title="规格" 
                    dataIndex="Product" 
                    key="spec" 
                    render={(product, record) => record.isTotal ? '' : (product?.spec || '')} 
                    width={100}
                  />
                  <Column 
                    title="数量" 
                    dataIndex="quantity" 
                    key="quantity" 
                    width={100}
                    align="center"
                    render={(text, record) => record.isTotal ? text : `${text} (${record.Product?.unit || ''})`}
                    onCell={(record) => ({
                      style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {}
                    })}
                  />
                  <Column 
                    title="单价" 
                    dataIndex="price" 
                    key="price" 
                    render={(text, record) => record.isTotal ? '' : `¥${text}`} 
                    width={100}
                    align="center"
                  />
                  <Column 
                    title="金额" 
                    dataIndex="subtotal" 
                    key="subtotal" 
                    render={(text, record) => `¥${text}`} 
                    width={100}
                    align="center"
                    onCell={(record) => ({
                      style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {}
                    })}
                  />
                  <Column 
                    title="备注" 
                    key="remark" 
                    render={(text, record) => record.isTotal ? '' : '-'} 
                    width={150}
                  />
                </Table>
              )}
            </div>
            
            {/* 入库单号信息 */}
            <div style={{ textAlign: 'right', padding: 16, backgroundColor: '#e6f7ff', borderRadius: 8, borderTop: '2px solid #1890ff' }}>
              <p style={{ fontSize: 14, color: '#666', margin: 0 }}>入库单号：{currentPurchase.id}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 添加供应商模态框 */}
      <Modal
        title="添加供应商"
        open={supplierModalVisible}
        onOk={handleSaveSupplier}
        onCancel={handleCloseSupplierModal}
        okText="确定"
        cancelText="取消"
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

export default Purchases;