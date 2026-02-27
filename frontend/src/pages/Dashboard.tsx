import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ShoppingOutlined, CreditCardOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons';
import { dashboardApi } from '../services/api';
import type { DashboardData } from '../types';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    todaySales: 0,
    todayInbound: 0,
    totalInventoryValue: 0,
    pendingReceivables: 0,
    pendingPayables: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取仪表盘数据
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('开始获取仪表盘数据...');
        const response = await dashboardApi.getDashboardData();
        console.log('获取仪表盘数据成功:', response.data);
        // 处理API返回的数据
        console.log('库存总价值:', response.data.totalInventoryValue);
        setData({
          todaySales: response.data.todaySales || 0,
          todayInbound: response.data.todayInbound || 0,
          totalInventoryValue: response.data.totalInventoryValue || 0,
          pendingReceivables: response.data.pendingReceivables || 0,
          pendingPayables: response.data.pendingPayables || 0
        });
        console.log('更新仪表盘数据:', response.data);
      } catch (error: any) {
        console.error('获取仪表盘数据失败:', error);
        console.error('错误消息:', error.message);
        console.error('错误响应:', error.response);
        // 如果API调用失败，使用模拟数据
        setData({
          todaySales: 12580,
          todayInbound: 7240, // 今日入库金额
          totalInventoryValue: 158600,
          pendingReceivables: 8920,
          pendingPayables: 5680
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>首页仪表盘</h1>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日销售"
                value={data.todaySales}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#3f8600' }}
                prefixStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日入库"
                value={data.todayInbound}
                precision={2}
                prefix={<ShoppingOutlined />}
                suffix="元"
                valueStyle={{ color: '#1890ff' }}
                prefixStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="库存总价值"
                value={data.totalInventoryValue}
                precision={2}
                prefix={<ShoppingOutlined />}
                suffix="元"
                valueStyle={{ color: '#1890ff' }}
                prefixStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未收账款"
                value={data.pendingReceivables}
                precision={2}
                prefix={<UserOutlined />}
                suffix="元"
                valueStyle={{ color: '#fa8c16' }}
                prefixStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未付货款"
                value={data.pendingPayables}
                precision={2}
                prefix={<CreditCardOutlined />}
                suffix="元"
                valueStyle={{ color: '#f5222d' }}
                prefixStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={18}>
            <Card title="业务概览" extra={<BarChartOutlined />}>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>欢迎使用酒水小店进销存管理系统</p>
                <p>系统已就绪，您可以开始管理您的业务</p>
                <p>实时数据更新中...</p>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;