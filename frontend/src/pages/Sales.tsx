import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Spin, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { saleApi, customerApi, productApi, inventoryApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Sale, Customer, Product, Inventory } from '../types';
import '../styles/table.css';

const { Column } = Table;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [editingRecord, setEditingRecord] = useState<Sale | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [items, setItems] = useState<{ product_id: string; product_spec: number; quantity: number; price: number; subtotal: number }[]>([]);
  // 加载状态
  const [submitting, setSubmitting] = useState(false);
  const [customerSubmitting, setCustomerSubmitting] = useState(false);

  // 获取销售单列表
  const fetchSales = async (customerName?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (customerName) {
        params.customerName = customerName;
      }
      const response = await saleApi.getSales(params);
      
      // 按照日期排序，最新的在前
      const sortedSales = response.data.sort((a, b) => {
        return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      });
      
      setSales(sortedSales);
    } catch (error) {
      message.error('获取销售单列表失败');
      console.error('获取销售单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = async (values: any) => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (values.customerName) {
        params.customerName = values.customerName;
      }
      
      const response = await saleApi.getSales(params);
      let filteredSales = response.data;
      
      // 应用日期筛选（前端）
      if (values.dateRange && values.dateRange[0]) {
        filteredSales = filteredSales.filter(sale => {
          return dayjs(sale.date).isAfter(dayjs(values.dateRange[0]).startOf('day'));
        });
      }
      
      if (values.dateRange && values.dateRange[1]) {
        filteredSales = filteredSales.filter(sale => {
          return dayjs(sale.date).isBefore(dayjs(values.dateRange[1]).endOf('day'));
        });
      }
      
      // 按照日期排序，最新的在前
      filteredSales.sort((a, b) => {
        return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      });
      
      setSales(filteredSales);
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
    fetchSales();
  };

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getCustomers();
      // 按创建时间倒序排序，新创建的排在前面
      const sortedCustomers = response.data.sort((a, b) => {
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
      setCustomers(sortedCustomers);
    } catch (error) {
      console.error('获取客户列表失败:', error);
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

  // 获取库存数据
  const fetchInventory = async () => {
    try {
      const response = await inventoryApi.getInventory();
      // 确保库存数据格式正确
      if (Array.isArray(response.data)) {
        setInventory(response.data);
      } else if (response.data && response.data.data) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('获取库存数据失败:', error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
    fetchInventory();
  }, []);

  // 打开添加销售单模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setItems([]);
    // 设置默认值
    const today = dayjs();
    form.setFieldsValue({
      date: today,
      operator: user?.name || user?.username || '当前用户'
    });
    setVisible(true);
  };

  // 打开编辑销售单模态框
  const handleEdit = (record: Sale) => {
    setEditingRecord(record);
    form.setFieldsValue({
      customer_id: record.customer_id,
      date: dayjs(record.date),
      operator: record.operator,
      remark: record.remark
    });
    // 设置销售明细
    setItems(record.SaleItems?.map(item => ({
      product_id: item.product_id,
      product_spec: item.Product?.spec || 0,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    })) || []);
    setVisible(true);
  };

  // 打开查看销售单模态框
  const handleView = (record: Sale) => {
    setCurrentSale(record);
    setViewVisible(true);
  };

  // 删除销售单
  const handleDelete = async (id: string) => {
    if (!id) {
      message.error('销售单ID不存在');
      return;
    }
    try {
      await saleApi.deleteSale(id);
      message.success('删除销售单成功');
      fetchSales();
    } catch (error) {
      message.error('删除销售单失败');
      console.error('删除销售单失败:', error);
    }
  };

  // 打开添加客户弹窗
  const handleOpenCustomerModal = () => {
    customerForm.resetFields();
    setCustomerModalVisible(true);
  };

  // 关闭添加客户弹窗
  const handleCloseCustomerModal = () => {
    setCustomerModalVisible(false);
  };

  // 保存新客户
  const handleSaveCustomer = async () => {
    try {
      setCustomerSubmitting(true);
      const values = await customerForm.validateFields();
      await customerApi.createCustomer({ 
        name: values.name,
        type: '个人',
        phone: ''
      });
      message.success('添加客户成功');
      setCustomerModalVisible(false);
      fetchCustomers(); // 重新获取客户列表
    } catch (error) {
      message.error('添加客户失败');
      console.error('添加客户失败:', error);
    } finally {
      setCustomerSubmitting(false);
    }
  };

  // 添加销售明细
  const handleAddItem = () => {
    setItems([...items, { product_id: '', product_spec: 0, quantity: 1, price: 0, subtotal: 0 }]);
  };

  // 删除销售明细
  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 更新销售明细
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // 当商品改变时，更新规格并重新计算
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].product_spec = selectedProduct.spec || 0;
      }
    }
    
    // 计算小计：单价 * 规格 * 数量
    newItems[index].subtotal = Number(newItems[index].price) * Number(newItems[index].product_spec) * Number(newItems[index].quantity);
    console.log('更新后的销售明细:', newItems);
    
    setItems(newItems);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      console.log('开始提交表单');
      console.log('当前库存数据:', inventory);
      console.log('当前销售明细:', items);
      
      const values = await form.validateFields();
      
      console.log('表单验证通过，值:', values);
      console.log('销售明细:', items);
      
      // 检查是否选择了客户
      if (!values.customer_id) {
        message.error('请选择客户');
        console.error('客户未选择');
        return;
      }
      
      // 检查是否添加了商品
      if (items.length === 0) {
        message.error('请添加销售商品');
        console.error('未添加销售商品');
        return;
      }
      
      // 检查每个商品是否选择了商品
      for (let i = 0; i < items.length; i++) {
        const currentItem = items[i];
        console.log(`检查第${i + 1}行商品:`, currentItem);
        if (!currentItem.product_id) {
          message.error(`第${i + 1}行商品未选择`);
          console.error(`第${i + 1}行商品未选择`);
          return;
        }
        if (!currentItem.price || currentItem.price <= 0) {
          message.error(`第${i + 1}行商品单价必须大于0`);
          console.error(`第${i + 1}行商品单价无效:`, currentItem.price);
          return;
        }
        if (!currentItem.quantity || currentItem.quantity <= 0) {
          message.error(`第${i + 1}行商品数量必须大于0`);
          console.error(`第${i + 1}行商品数量无效:`, currentItem.quantity);
          return;
        }
        // 检查库存
        const inv = inventory.find(invItem => invItem.product_id === currentItem.product_id);
        console.log(`第${i + 1}行商品库存信息:`, inv);
        if (!inv) {
          message.error(`第${i + 1}行商品库存信息不存在`);
          console.error(`第${i + 1}行商品库存信息不存在`);
          return;
        }
        if (inv.current_quantity < currentItem.quantity) {
          message.error(`第${i + 1}行商品库存不足`);
          console.error(`第${i + 1}行商品库存不足: 现有${inv.current_quantity}，需要${currentItem.quantity}`);
          return;
        }
      }
      
      // 计算总金额
      const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
      console.log('总金额:', total_amount);
      
      // 准备销售明细数据，只包含后端需要的字段
      const formattedItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }));
      
      // 检查日期字段
      let formattedDate = '';
      if (values.date) {
        try {
          formattedDate = dayjs(values.date).format('YYYY-MM-DD HH:mm:ss');
          console.log('格式化后的日期:', formattedDate);
        } catch (dateError) {
          console.error('日期格式化错误:', dateError);
          message.error('日期格式错误');
          return;
        }
      } else {
        message.error('请选择出库日期');
        console.error('出库日期未选择');
        return;
      }
      
      const saleData = {
        customer_id: values.customer_id,
        date: formattedDate,
        items: formattedItems,
        operator: values.operator,
        remark: values.remark
      };
      
      console.log('格式化后的销售明细:', formattedItems);
      
      console.log('提交的销售单数据:', saleData);
      
      if (editingRecord) {
        // 更新销售单
        console.log('更新销售单，ID:', editingRecord.id);
        await saleApi.updateSale(editingRecord.id, saleData);
        message.success('更新销售单成功');
      } else {
        // 创建销售单
        console.log('创建销售单');
        try {
          const response = await saleApi.createSale(saleData);
          console.log('创建销售单成功，响应:', response);
          message.success('创建销售单成功');
        } catch (apiError: any) {
          console.error('API错误:', apiError);
          console.error('API错误响应:', apiError.response);
          if (apiError.response && apiError.response.data && apiError.response.data.error) {
            message.error(`操作失败: ${apiError.response.data.error}`);
          } else {
            message.error('操作失败，请稍后重试');
          }
          return;
        }
      }
      
      setVisible(false);
      fetchSales();
      fetchInventory(); // 刷新库存数据
    } catch (error: any) {
      message.error('操作失败，请检查输入');
      console.error('操作失败:', error);
      console.error('错误消息:', error.message);
      console.error('错误响应:', error.response);
      if (error.errorFields) {
        console.error('错误字段:', error.errorFields);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>销售出库管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加销售单
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
          <Form.Item name="customerName" label="客户名称" style={{ marginBottom: 0 }}>
            <Input
              placeholder="请输入客户名称"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="dateRange" label="出库日期" style={{ marginBottom: 0 }}>
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
        <div className="table-title">销售出库单</div>
        <Spin spinning={loading}>
          <Table 
            dataSource={sales.filter(item => item)} 
            rowKey={(record) => record.id} 
            pagination={{ pageSize: 10 }}
            className="custom-table"
          >
            <Column title="出库单号" dataIndex="id" key="id" ellipsis />
            <Column 
              title="客户" 
              dataIndex="Customer" 
              key="customer" 
              render={(customer) => customer?.name || ''} 
            />
            <Column title="出库日期" dataIndex="date" key="date" render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')} />
            <Column title="总金额" dataIndex="total_amount" key="total_amount" render={(text) => `¥${text}`} />
            <Column title="结算状态" dataIndex="settlement_status" key="settlement_status" />
            <Column title="经手人" dataIndex="operator" key="operator" />
            <Column title="备注" dataIndex="remark" key="remark" render={(text) => text || '-'} />
            <Column 
              title="操作" 
              key="action" 
              render={(_, record) => (
                <div>
                  <Button 
                    icon={<EyeOutlined />} 
                    style={{ marginRight: 8 }} 
                    onClick={() => handleView(record)}
                  />
                  <Button 
                    icon={<EditOutlined />} 
                    style={{ marginRight: 8 }} 
                    onClick={() => handleEdit(record)}
                  />
                  <Popconfirm 
                    title="确定要删除这个销售单吗？" 
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

      {/* 添加/编辑销售单模态框 */}
      <Modal
        title={editingRecord ? '编辑销售单' : '添加销售单'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <Form.Item 
              name="customer_id" 
              label="客户" 
              rules={[{ required: true, message: '请选择客户' }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Select 
                placeholder="请选择客户" 
                style={{ width: '100%' }}
                showSearch
                filterOption={(input: string, option: any) => {
                  if (!option) return false;
                  const optionText = option.children || '';
                  const text = String(optionText);
                  return text.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {customers.map(customer => (
                  <Select.Option key={customer.id} value={customer.id}>{customer.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button type="primary" onClick={handleOpenCustomerModal} style={{ marginTop: 24 }}>
              添加客户
            </Button>
          </div>
          <Form.Item 
            name="date" 
            label="出库日期" 
            rules={[{ required: true, message: '请选择出库日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
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
          
          <h3 style={{ marginTop: 24, marginBottom: 16 }}>销售明细</h3>
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
                <div>
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
                    {products
                      // 关联库存信息并过滤出有库存的商品
                      .map(product => {
                        const productInventory = inventory.find(i => i.product_id === product.id);
                        return {
                          ...product,
                          current_quantity: productInventory?.current_quantity || 0
                        };
                      })
                      .filter(product => product.current_quantity > 0)
                      // 按照库存由大到小排序
                      .sort((a, b) => b.current_quantity - a.current_quantity)
                      .map(product => (
                        <Select.Option key={product.id} value={product.id}>
                          {product.name} ({product.spec}) - 库存: {product.current_quantity}
                        </Select.Option>
                      ))}
                  </Select>
                  {item.product_id && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                      库存: {inventory.find(i => i.product_id === item.product_id)?.current_quantity || 0}
                    </div>
                  )}
                </div>
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
                label="单价" 
                style={{ flex: 1 }}
                rules={[{ required: true, message: '请输入单价' }]}
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
              {/* 计算字段显示 */}
              <Form.Item 
                label="计算" 
                style={{ flex: 1 }}
              >
                <div style={{ padding: '4px 8px', height: '32px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#fafafa', textAlign: 'center', lineHeight: '24px', fontSize: 12, fontWeight: 'bold', color: '#ff4d4f' }}>
                  {Number(item.price).toFixed(2)} * {Number(item.product_spec)} * {Number(item.quantity)}
                </div>
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

      {/* 查看销售单模态框 */}
      <Modal
        title="销售出库单"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewVisible(false)}>关闭</Button>
        ]}
        width={900}
      >
        {currentSale && (
          <div>
            {/* 顶部信息 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>销售出库单</h2>
              <div style={{ textAlign: 'right' }}>
                <p><strong>录单日期</strong> {dayjs(currentSale.date).format('YYYY-MM-DD')}</p>
              </div>
            </div>
            
            {/* 基本信息 */}
            <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <strong>客户 *</strong> {currentSale.Customer?.name || ''}
                </div>
                <div>
                  <strong>经手人 *</strong> {currentSale.operator}
                </div>
                <div>
                  <strong>结算状态</strong> 
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: currentSale.settlement_status === '已结' ? '#52c41a' : '#fa541c',
                    color: 'white',
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}>
                    {currentSale.settlement_status}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <strong>摘要</strong> {currentSale.remark || ''}
              </div>
            </div>
            
            {/* 商品明细表格 */}
            <div className="table-container" style={{ marginBottom: 24 }}>
              {currentSale.SaleItems && (
                <Table 
                  dataSource={[
                    ...currentSale.SaleItems,
                    {
                      id: 'total',
                      isTotal: true,
                      quantity: currentSale.SaleItems.reduce((sum, item) => sum + item.quantity, 0),
                      subtotal: currentSale.total_amount
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
            
            {/* 出库单号信息 */}
            <div style={{ textAlign: 'right', padding: 16, backgroundColor: '#e6f7ff', borderRadius: 8, borderTop: '2px solid #1890ff' }}>
              <p style={{ fontSize: 14, color: '#666', margin: 0 }}>出库单号：{currentSale.id}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 添加客户模态框 */}
      <Modal
        title="添加客户"
        open={customerModalVisible}
        onOk={handleSaveCustomer}
        onCancel={handleCloseCustomerModal}
        okText="确定"
        cancelText="取消"
        confirmLoading={customerSubmitting}
      >
        <Form form={customerForm} layout="vertical">
          <Form.Item 
            name="name" 
            label="客户名称" 
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Sales;