import { useEffect, useState } from 'react';
import { Table, Tabs, Button, Modal, Form, Select, Input, message, Spin } from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { inventoryApi, productApi } from '../services/api';
import type { Inventory, InventoryLog, Product } from '../types';
import dayjs from 'dayjs';
import '../styles/table.css';

const { Column } = Table;
const { TabPane } = Tabs;

const Inventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  // 搜索和排序状态
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    sortBy: 'current_quantity',
    sortOrder: 'descend'
  });
  const [searchForm] = Form.useForm();

  // 获取库存列表
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getInventory();
      let filteredInventory = response.data;
      
      // 只显示库存大于0的商品
      filteredInventory = filteredInventory.filter(item => item.current_quantity > 0);
      
      // 应用搜索
      if (searchParams.keyword) {
        const keyword = searchParams.keyword.toLowerCase();
        filteredInventory = filteredInventory.filter(item => {
          const product = products.find(p => p.id === item.product_id);
          return product && (
            product.name.toLowerCase().includes(keyword) ||
            product.unit.toLowerCase().includes(keyword)
          );
        });
      }
      
      // 应用排序
      filteredInventory.sort((a, b) => {
        let comparison = 0;
        if (searchParams.sortBy === 'current_quantity') {
          comparison = a.current_quantity - b.current_quantity;
        } else if (searchParams.sortBy === 'avg_cost') {
          comparison = Number(a.avg_cost) - Number(b.avg_cost);
        } else if (searchParams.sortBy === 'inventory_value') {
          const valueA = a.current_quantity * Number(a.avg_cost);
          const valueB = b.current_quantity * Number(b.avg_cost);
          comparison = valueA - valueB;
        }
        return searchParams.sortOrder === 'descend' ? -comparison : comparison;
      });
      
      setInventory(filteredInventory);
    } catch (error) {
      message.error('获取库存列表失败');
      console.error('获取库存列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取库存流水
  const fetchInventoryLogs = async (product_id?: string) => {
    try {
      setLogLoading(true);
      const response = await inventoryApi.getInventoryLogs(product_id);
      setInventoryLogs(response.data);
    } catch (error) {
      message.error('获取库存流水失败');
      console.error('获取库存流水失败:', error);
    } finally {
      setLogLoading(false);
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

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchInventoryLogs();
  }, []);

  // 查看商品库存详情
  const handleViewInventory = (record: Inventory) => {
    setSelectedInventory(record);
    setSelectedProduct(products.find(p => p.id === record.product_id) || null);
    setViewVisible(true);
  };

  // 刷新库存
  const handleRefreshInventory = () => {
    fetchInventory();
  };

  // 处理搜索
  const handleSearch = async (values: any) => {
    setSearchParams({
      ...searchParams,
      keyword: values.keyword || ''
    });
    fetchInventory();
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      keyword: '',
      sortBy: 'current_quantity',
      sortOrder: 'descend'
    });
    fetchInventory();
  };

  // 处理排序变化
  const handleSortChange = (pagination: any, filters: any, sorter: any) => {
    if (sorter.field) {
      setSearchParams({
        ...searchParams,
        sortBy: sorter.field === 'inventory_value' ? 'inventory_value' : sorter.field,
        sortOrder: sorter.order || 'descend'
      });
      fetchInventory();
    }
  };

  // 导出库存数据为CSV
  const handleExportInventory = () => {
    try {
      // 准备CSV表头
      const headers = ['商品名称', '规格', '单位', '库存数量', '成本价', '库存价值'];
      
      // 准备CSV数据行
      const rows = inventory.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return [
          product?.name || '',
          product?.spec || '',
          product?.unit || '',
          item.current_quantity,
          Number(item.avg_cost).toFixed(2),
          calculateInventoryValue(item).toFixed(2)
        ];
      });
      
      // 组合表头和数据
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // 设置下载属性
      link.setAttribute('href', url);
      link.setAttribute('download', `库存导出_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      
      // 添加到DOM并点击下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('库存导出成功');
    } catch (error) {
      message.error('库存导出失败');
      console.error('导出失败:', error);
    }
  };

  // 刷新库存流水
  const handleRefreshLogs = (product_id?: string) => {
    fetchInventoryLogs(product_id);
  };

  // 计算库存价值
  const calculateInventoryValue = (record: Inventory) => {
    const product = products.find(p => p.id === record.product_id);
    const spec = product?.spec || 1;
    return record.current_quantity * record.avg_cost * spec;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>库存管理</h1>
        <div>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExportInventory}
            style={{ marginRight: 8 }}
          >
            导出库存
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshInventory}>
            刷新库存
          </Button>
        </div>
      </div>
      
      <Tabs defaultActiveKey="inventory" style={{ marginBottom: 24 }}>
        <TabPane tab="实时库存" key="inventory">
          {/* 搜索表单 */}
          <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Form
              form={searchForm}
              layout="inline"
              onFinish={handleSearch}
              style={{ width: '100%' }}
            >
              <Form.Item name="keyword" label="搜索" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="搜索商品名称或单位"
                  prefix={<SearchOutlined />}
                  style={{ width: 300 }}
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
          <Spin spinning={loading}>
            <div className="table-container">
              <div className="table-title">实时库存表</div>
              <Table 
                dataSource={inventory} 
                rowKey="product_id" 
                pagination={{ pageSize: 10 }}
                className="custom-table"
                onChange={handleSortChange}
              >
                <Column 
                  title="商品名称" 
                  dataIndex="Product" 
                  key="product_name" 
                  render={(product) => product?.name || ''} 
                />
                <Column 
                  title="规格" 
                  dataIndex="Product" 
                  key="product_spec" 
                  render={(product) => product?.spec || 0} 
                />
                <Column 
                  title="单位" 
                  dataIndex="Product" 
                  key="product_unit" 
                  render={(product) => product?.unit || ''} 
                />
                <Column 
                  title="库存数量" 
                  dataIndex="current_quantity" 
                  key="current_quantity" 
                  sorter={(a, b) => a.current_quantity - b.current_quantity}
                  defaultSortOrder="descend"
                  render={(quantity, record) => {
                    const product = products.find(p => p.id === record.product_id);
                    const isLowStock = product && quantity <= product.min_stock;
                    return (
                      <span style={{ color: isLowStock ? '#ff4d4f' : '' }}>
                        {quantity} {isLowStock && '(库存不足)'}
                      </span>
                    );
                  }}
                />
                <Column 
                  title="成本价" 
                  dataIndex="avg_cost" 
                  key="avg_cost" 
                  sorter={(a, b) => Number(a.avg_cost) - Number(b.avg_cost)}
                  render={(price) => `¥${Number(price).toFixed(2)}`} 
                />
                <Column 
                  title="库存价值" 
                  key="inventory_value" 
                  sorter={(a, b) => {
                    const valueA = a.current_quantity * Number(a.avg_cost);
                    const valueB = b.current_quantity * Number(b.avg_cost);
                    return valueA - valueB;
                  }}
                  render={(record) => `¥${calculateInventoryValue(record).toFixed(2)}`} 
                />
                <Column 
                  title="操作" 
                  key="action" 
                  render={(_, record) => (
                    <Button 
                      icon={<EyeOutlined />} 
                      onClick={() => handleViewInventory(record)}
                    >
                      查看详情
                    </Button>
                  )} 
                />
              </Table>
            </div>
          </Spin>
        </TabPane>
        
        <TabPane tab="库存流水" key="logs">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Form layout="inline">
              <Form.Item label="商品">
                <Select 
                  style={{ width: 200 }} 
                  placeholder="选择商品" 
                  onChange={(value) => handleRefreshLogs(value)}
                >
                  <Select.Option value="">全部商品</Select.Option>
                  {products.map(product => (
                    <Select.Option key={product.id} value={product.id}>{product.name} ({product.spec})</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button icon={<ReloadOutlined />} onClick={() => handleRefreshLogs()}>
                  刷新流水
                </Button>
              </Form.Item>
            </Form>
          </div>
          
          <Spin spinning={logLoading}>
            <div className="table-container">
              <div className="table-title">库存流水</div>
              <Table 
                dataSource={inventoryLogs} 
                rowKey="id" 
                pagination={{ pageSize: 10 }}
                className="custom-table"
              >
                <Column 
                  title="商品名称" 
                  dataIndex="Product" 
                  key="product_name" 
                  render={(product) => product?.name || ''} 
                />
                <Column 
                  title="类型" 
                  dataIndex="type" 
                  key="type" 
                  render={(type) => (
                    <span style={{ color: type === '入库' ? '#52c41a' : '#fa541c' }}>
                      {type}
                    </span>
                  )}
                />
                <Column 
                  title="数量" 
                  dataIndex="quantity" 
                  key="quantity" 
                  render={(quantity, record) => (
                    <span style={{ color: record.type === '入库' ? '#52c41a' : '#fa541c' }}>
                      {record.type === '入库' ? '+' : '-'}{quantity}
                    </span>
                  )}
                />
                <Column 
                  title="单价" 
                  dataIndex="price" 
                  key="price" 
                  render={(price) => `¥${price}`} 
                />
                <Column 
                  title="相关单据" 
                  dataIndex="related_bill_no" 
                  key="related_bill_no" 
                  ellipsis
                />
                <Column 
                  title="结存数量" 
                  dataIndex="balance" 
                  key="balance" 
                />
                <Column 
                  title="操作时间" 
                  dataIndex="create_time" 
                  key="create_time" 
                  render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
                />
              </Table>
            </div>
          </Spin>
        </TabPane>
      </Tabs>

      {/* 查看库存详情模态框 */}
      <Modal
        title="库存详情"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewVisible(false)}>关闭</Button>
        ]}
        width={600}
      >
        {selectedInventory && selectedProduct && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <p><strong>商品名称：</strong>{selectedProduct.name}</p>
              <p><strong>规格：</strong>{selectedProduct.spec}</p>
              <p><strong>单位：</strong>{selectedProduct.unit}</p>
              <p><strong>当前库存：</strong>
                <span style={{ color: selectedInventory.current_quantity <= selectedProduct.min_stock ? '#ff4d4f' : '' }}>
                  {selectedInventory.current_quantity}
                </span>
                {selectedInventory.current_quantity <= selectedProduct.min_stock && ' (库存不足)'}
              </p>
              <p><strong>安全库存：</strong>{selectedProduct.min_stock}</p>
              <p><strong>成本价：</strong>¥{Number(selectedInventory.avg_cost).toFixed(2)}</p>
              <p><strong>库存价值：</strong>¥{calculateInventoryValue(selectedInventory).toFixed(2)}</p>
              <p><strong>默认售价：</strong>¥{selectedProduct.sale_price}</p>
            </div>
            
            <h3 style={{ marginBottom: 16 }}>最近库存变动</h3>
            <Button 
              type="link" 
              onClick={() => {
                setViewVisible(false);
                handleRefreshLogs(selectedProduct.id);
                // 切换到库存流水标签
                // 注意：这里需要手动切换标签，实际项目中可以使用Tabs的activeKey状态管理
              }}
            >
              查看完整库存流水
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;