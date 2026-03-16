import { useState, useEffect } from 'react';
import { Card, Table, Spin, Alert, Badge, Statistic, Row, Col, Input } from 'antd';
import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { inventoryApi, reportApi } from '../../services/api';

const { Search } = Input;

const MobileInventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // 获取库存数据
  const fetchInventory = async () => {
    try {
      setLoading(true);
      console.log('开始获取库存数据...');
      const response = await inventoryApi.getInventory();
      console.log('库存数据响应:', response);
      console.log('库存数据:', response.data);
      console.log('库存数据数量:', response.data?.length);
      setInventory(response.data);
    } catch (error) {
      console.error('获取库存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 获取库存数量（兼容quantity和current_quantity字段）
  const getQuantity = (item: any) => {
    return item.quantity !== undefined ? item.quantity : item.current_quantity || 0;
  };

  // 过滤库存数据并按库存数量降序排序
  const filteredInventory = inventory.filter(item => 
    item.Product && 
    (item.Product.name.toLowerCase().includes(searchText.toLowerCase()) ||
     item.Product.spec.toString().toLowerCase().includes(searchText.toLowerCase()))
  ).sort((a, b) => {
    const quantityA = getQuantity(a);
    const quantityB = getQuantity(b);
    return quantityB - quantityA; // 降序排序
  });

  // 计算总库存价值
  const totalValue = inventory.reduce((sum, item) => {
    const quantity = getQuantity(item);
    if (item.Product && quantity > 0) {
      // 使用avg_cost（平均成本）而不是purchase_price
      const avgCost = item.avg_cost || 0;
      return sum + (quantity * parseFloat(avgCost.toString()));
    }
    return sum;
  }, 0);



  // 库存状态
  const getStockStatus = (item: any) => {
    if (!item.Product) return { status: 'normal', text: '正常' };
    const quantity = getQuantity(item);
    if (quantity <= 0) {
      return { status: 'danger', text: '缺货' };
    } else if (quantity <= item.Product.min_stock) {
      return { status: 'warning', text: '低库存' };
    } else {
      return { status: 'success', text: '正常' };
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'Product',
      key: 'Product',
      render: (product: any) => product ? `${product.name} ${product.spec}` : '-',
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_: any, record: any) => {
        const quantity = getQuantity(record);
        const status = getStockStatus(record);
        return (
          <Badge 
            status={status.status} 
            text={`${quantity} ${record.Product?.unit || ''}`}
          />
        );
      },
    },
    {
      title: '库存价值',
      dataIndex: 'value',
      key: 'value',
      render: (_: any, record: any) => {
        const quantity = getQuantity(record);
        const avgCost = record.avg_cost || 0;
        const value = quantity * parseFloat(avgCost.toString());
        return `¥${value.toFixed(2)}`;
      },
    },
  ];

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 库存概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Statistic 
              title="总库存价值" 
              value={totalValue} 
              prefix="¥" 
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索框 */}
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索商品"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: '100%' }}
        />
      </div>

      {/* 库存明细 */}
      <Card title="库存明细" style={{ marginBottom: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredInventory.length > 0 ? (
          <Table 
            dataSource={filteredInventory} 
            rowKey="product_id" 
            columns={columns} 
            pagination={{ 
              pageSize: 10, 
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`
            }}
            size="small"
          />
        ) : (
          <Alert 
            message="暂无库存数据" 
            type="info" 
            showIcon 
            style={{ margin: '20px 0' }}
          />
        )}
      </Card>
    </div>
  );
};

export default MobileInventory;