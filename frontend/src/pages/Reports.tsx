import { useEffect, useState } from 'react';
import { Card, Row, Col, DatePicker, Button, Select, Spin, Table, message, Pagination } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { reportApi } from '../services/api';
import type { BusinessReport, ProductRanking, CustomerRanking, SupplierRanking } from '../types';
import '../styles/table.css';

const { Column } = Table;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [businessReport, setBusinessReport] = useState<BusinessReport | null>(null);
  const [inventoryValueReport, setInventoryValueReport] = useState<any>(null);
  const [productRanking, setProductRanking] = useState<ProductRanking[]>([]);
  const [customerRanking, setCustomerRanking] = useState<CustomerRanking[]>([]);
  const [supplierRanking, setSupplierRanking] = useState<SupplierRanking[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<any>(null);
  const [accountsPayable, setAccountsPayable] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // 设置默认日期范围为最近30天
  const [dateRange, setDateRange] = useState<[string, string]>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return [startDate.toISOString(), endDate.toISOString()];
  });
  const [reportType, setReportType] = useState('business');
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 获取经营报表
  const fetchBusinessReport = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const response = await reportApi.getBusinessReport(startDate, endDate);
      setBusinessReport(response.data);
    } catch (error) {
      message.error('获取经营报表失败');
      console.error('获取经营报表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取库存价值报表
  const fetchInventoryValueReport = async () => {
    try {
      setLoading(true);
      const response = await reportApi.getInventoryValueReport(pagination.current, pagination.pageSize);
      setInventoryValueReport(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_items || 0
      }));
    } catch (error) {
      message.error('获取库存价值报表失败');
      console.error('获取库存价值报表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取商品销售排行
  const fetchProductRanking = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const response = await reportApi.getProductRanking(startDate, endDate, pagination.current, pagination.pageSize);
      setProductRanking(response.data);
    } catch (error) {
      message.error('获取商品销售排行失败');
      console.error('获取商品销售排行失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取客户销售排行
  const fetchCustomerRanking = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const response = await reportApi.getCustomerRanking(startDate, endDate, pagination.current, pagination.pageSize);
      setCustomerRanking(response.data);
    } catch (error) {
      message.error('获取客户销售排行失败');
      console.error('获取客户销售排行失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取供应商采购排行
  const fetchSupplierRanking = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const response = await reportApi.getSupplierRanking(startDate, endDate, pagination.current, pagination.pageSize);
      setSupplierRanking(response.data);
    } catch (error) {
      message.error('获取供应商采购排行失败');
      console.error('获取供应商采购排行失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取应收账款账龄分析
  const fetchAccountsReceivable = async () => {
    try {
      setLoading(true);
      const response = await reportApi.getAccountsReceivable();
      setAccountsReceivable(response.data);
    } catch (error) {
      message.error('获取应收账款账龄分析失败');
      console.error('获取应收账款账龄分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取应付账款账龄分析
  const fetchAccountsPayable = async () => {
    try {
      setLoading(true);
      const response = await reportApi.getAccountsPayable();
      setAccountsPayable(response.data);
    } catch (error) {
      message.error('获取应付账款账龄分析失败');
      console.error('获取应付账款账龄分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化图表
  useEffect(() => {
    // 初始加载时获取所有报表数据
    fetchBusinessReport();
    fetchInventoryValueReport();
    fetchProductRanking();
    fetchCustomerRanking();
    fetchSupplierRanking();
    fetchAccountsReceivable();
    fetchAccountsPayable();
  }, [dateRange, pagination.current, pagination.pageSize]); // 当日期范围或分页变化时重新获取数据

  // 刷新报表
  const handleRefreshReport = () => {
    switch (reportType) {
      case 'business':
        fetchBusinessReport();
        break;
      case 'inventory':
        fetchInventoryValueReport();
        break;
      case 'product':
        fetchProductRanking();
        break;
      case 'customer':
        fetchCustomerRanking();
        break;
      case 'supplier':
        fetchSupplierRanking();
        break;
      case 'accounts-receivable':
        fetchAccountsReceivable();
        break;
      case 'accounts-payable':
        fetchAccountsPayable();
        break;
      default:
        break;
    }
  };

  // 处理分页变化
  const handlePaginationChange = (current: number, pageSize: number) => {
    setPagination({
      current,
      pageSize,
      total: pagination.total
    });
  };

  // 初始化经营报表图表
  useEffect(() => {
    if (reportType === 'business' && businessReport) {
      const chartDom = document.getElementById('businessChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '经营数据趋势',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: ¥{c}'
          },
          legend: {
            data: ['销售收入', '销售成本', '毛利'],
            bottom: 0
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: ['本期']
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '¥{value}'
            }
          },
          series: [
            {
              name: '销售收入',
              type: 'bar',
              data: [businessReport.sales],
              itemStyle: {
                color: '#1890ff'
              }
            },
            {
              name: '销售成本',
              type: 'bar',
              data: [businessReport.cost],
              itemStyle: {
                color: '#fa8c16'
              }
            },
            {
              name: '毛利',
              type: 'bar',
              data: [businessReport.grossProfit],
              itemStyle: {
                color: '#52c41a'
              }
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
        
        return () => {
          myChart.dispose();
          window.removeEventListener('resize', () => {
            myChart.resize();
          });
        };
      }
    }
  }, [reportType, businessReport]);

  // 初始化商品销售排行图表
  useEffect(() => {
    if (reportType === 'product' && productRanking.length > 0) {
      const chartDom = document.getElementById('productChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const productNames = productRanking.slice(0, 10).map(item => item.product_name);
        const salesAmounts = productRanking.slice(0, 10).map(item => item.sales_amount);
        const profits = productRanking.slice(0, 10).map(item => item.profit);
        
        const option = {
          title: {
            text: '商品销售排行',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>{a}: ¥{c}'
          },
          legend: {
            data: ['销售金额', '利润'],
            bottom: 0
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: productNames,
            axisLabel: {
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '¥{value}'
            }
          },
          series: [
            {
              name: '销售金额',
              type: 'bar',
              data: salesAmounts,
              itemStyle: {
                color: '#1890ff'
              }
            },
            {
              name: '利润',
              type: 'bar',
              data: profits,
              itemStyle: {
                color: '#52c41a'
              }
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
        
        return () => {
          myChart.dispose();
          window.removeEventListener('resize', () => {
            myChart.resize();
          });
        };
      }
    }
  }, [reportType, productRanking]);

  // 初始化客户销售排行图表
  useEffect(() => {
    if (reportType === 'customer' && customerRanking.length > 0) {
      const chartDom = document.getElementById('customerChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const customerData = customerRanking.slice(0, 8).map(item => ({
          name: item.customer_name,
          value: item.sales_amount
        }));
        
        const option = {
          title: {
            text: '客户销售占比',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: ¥{c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            bottom: 0
          },
          series: [
            {
              name: '销售金额',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: customerData
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
        
        return () => {
          myChart.dispose();
          window.removeEventListener('resize', () => {
            myChart.resize();
          });
        };
      }
    }
  }, [reportType, customerRanking]);

  // 初始化供应商采购排行图表
  useEffect(() => {
    if (reportType === 'supplier' && supplierRanking.length > 0) {
      const chartDom = document.getElementById('supplierChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const supplierNames = supplierRanking.slice(0, 10).map(item => item.supplier_name);
        const purchaseAmounts = supplierRanking.slice(0, 10).map(item => item.purchase_amount);
        
        const option = {
          title: {
            text: '供应商采购金额',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: ¥{c}'
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: supplierNames,
            axisLabel: {
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '¥{value}'
            }
          },
          series: [
            {
              name: '采购金额',
              type: 'bar',
              data: purchaseAmounts,
              itemStyle: {
                color: '#722ed1'
              }
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
        
        return () => {
          myChart.dispose();
          window.removeEventListener('resize', () => {
            myChart.resize();
          });
        };
      }
    }
  }, [reportType, supplierRanking]);

  // 初始化应收账款账龄分析图表
  useEffect(() => {
    if (reportType === 'accounts-receivable' && accountsReceivable) {
      const chartDom = document.getElementById('accountsReceivableChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '应收账款账龄分析',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: ¥{c} ({d}%)'
          },
          legend: {
            data: ['7天内', '7-30天', '30-60天', '60天以上'],
            bottom: 0
          },
          series: [
            {
              name: '应收账款',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                { value: accountsReceivable.within7Days, name: '7天内' },
                { value: accountsReceivable.days7To30, name: '7-30天' },
                { value: accountsReceivable.days30To60, name: '30-60天' },
                { value: accountsReceivable.over60Days, name: '60天以上' }
              ]
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
        
        return () => {
          myChart.dispose();
          window.removeEventListener('resize', () => {
            myChart.resize();
          });
        };
      }
    }
  }, [reportType, accountsReceivable]);

  // 初始化应付账款账龄分析图表
  useEffect(() => {
    if (reportType === 'accounts-payable' && accountsPayable) {
      const chartDom = document.getElementById('accountsPayableChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '应付账款账龄分析',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: ¥{c} ({d}%)'
          },
          legend: {
            data: ['7天内', '7-30天', '30-60天', '60天以上'],
            bottom: 0
          },
          series: [
            {
              name: '应付账款',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                { value: accountsPayable.within7Days, name: '7天内' },
                { value: accountsPayable.days7To30, name: '7-30天' },
                { value: accountsPayable.days30To60, name: '30-60天' },
                { value: accountsPayable.over60Days, name: '60天以上' }
              ]
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
        
        return () => {
          myChart.dispose();
          window.removeEventListener('resize', () => {
            myChart.resize();
          });
        };
      }
    }
  }, [reportType, accountsPayable]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>报表分析</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <RangePicker 
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
              }
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefreshReport}>
            刷新报表
          </Button>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Select 
          defaultValue="business" 
          style={{ width: 240 }} 
          onChange={setReportType}
          size="large"
        >
          <Option value="business">经营报表</Option>
          <Option value="inventory">库存价值报表</Option>
          <Option value="product">商品销售排行</Option>
          <Option value="customer">客户销售排行</Option>
          <Option value="supplier">供应商采购排行</Option>
          <Option value="accounts-receivable">应收账款账龄分析</Option>
          <Option value="accounts-payable">应付账款账龄分析</Option>
        </Select>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefreshReport} size="large">
            刷新数据
          </Button>
        </div>
      </div>

      <Spin spinning={loading} tip="数据加载中...">
        {reportType === 'business' && (
           <Card title="经营报表" style={{ marginBottom: 24 }}>
             <Row gutter={[16, 16]}>
               <Col span={6}>
                 <Card>
                   <h3>销售收入</h3>
                   <p style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>¥{businessReport?.sales || 0}</p>
                 </Card>
               </Col>
               <Col span={6}>
                 <Card>
                   <h3>销售成本</h3>
                   <p style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>¥{businessReport?.cost || 0}</p>
                 </Card>
               </Col>
               <Col span={6}>
                 <Card>
                   <h3>毛利</h3>
                   <p style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>¥{businessReport?.grossProfit || 0}</p>
                 </Card>
               </Col>
               <Col span={6}>
                 <Card>
                   <h3>毛利率</h3>
                   <p style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>{businessReport?.grossProfitRate || '0%'}</p>
                 </Card>
               </Col>
             </Row>
             <div style={{ marginTop: 24, height: 400 }} id="businessChart"></div>
           </Card>
         )}

        {reportType === 'inventory' && (
          <Card title="库存价值报表" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h3>总库存价值: ¥{inventoryValueReport?.total_value || 0}</h3>
              <p>总商品数: {inventoryValueReport?.total_items || 0}</p>
            </div>
            <div className="table-container">
              <div className="table-title">库存价值报表</div>
              <Table 
                dataSource={inventoryValueReport?.items} 
                rowKey="product_id" 
                pagination={{ 
                  current: pagination.current, 
                  pageSize: pagination.pageSize, 
                  total: inventoryValueReport?.total_items || 0,
                  onChange: handlePaginationChange
                }}
                className="custom-table"
              >
                <Column title="商品名称" dataIndex="product_name" key="product_name" />
                <Column title="规格" dataIndex="spec" key="spec" />
                <Column title="单位" dataIndex="unit" key="unit" />
                <Column title="库存数量" dataIndex="quantity" key="quantity" />
                <Column title="成本价" dataIndex="avg_cost" key="avg_cost" render={(text) => `¥${text}`} />
                <Column title="库存价值" dataIndex="total_value" key="total_value" render={(text) => `¥${text}`} />
              </Table>
            </div>
          </Card>
        )}

        {reportType === 'product' && (
           <Card title="商品销售排行" style={{ marginBottom: 24 }}>
             <div style={{ marginTop: 24, height: 400 }} id="productChart"></div>
             <div className="table-container">
               <div className="table-title">商品销售排行</div>
               <Table 
                 dataSource={productRanking} 
                 rowKey="product_id" 
                 pagination={{ 
                   current: pagination.current, 
                   pageSize: pagination.pageSize, 
                   onChange: handlePaginationChange
                 }}
                 className="custom-table"
               >
                 <Column title="商品名称" dataIndex="product_name" key="product_name" />
                 <Column title="规格" dataIndex="spec" key="spec" />
                 <Column title="销售数量" dataIndex="quantity" key="quantity" />
                 <Column title="销售金额" dataIndex="sales_amount" key="sales_amount" render={(text) => `¥${text}`} />
                 <Column title="成本金额" dataIndex="cost_amount" key="cost_amount" render={(text) => `¥${text}`} />
                 <Column title="毛利" dataIndex="profit" key="profit" render={(text) => `¥${text}`} />
               </Table>
             </div>
           </Card>
         )}

        {reportType === 'customer' && (
           <Card title="客户销售排行" style={{ marginBottom: 24 }}>
             <div style={{ marginTop: 24, height: 400 }} id="customerChart"></div>
             <div className="table-container">
               <div className="table-title">客户销售排行</div>
               <Table 
                 dataSource={customerRanking} 
                 rowKey="customer_id" 
                 pagination={{ 
                   current: pagination.current, 
                   pageSize: pagination.pageSize, 
                   onChange: handlePaginationChange
                 }}
                 className="custom-table"
               >
                 <Column title="客户名称" dataIndex="customer_name" key="customer_name" />
                 <Column title="销售金额" dataIndex="sales_amount" key="sales_amount" render={(text) => `¥${text}`} />
                 <Column title="订单数" dataIndex="order_count" key="order_count" />
               </Table>
             </div>
           </Card>
         )}

        {reportType === 'supplier' && (
           <Card title="供应商采购排行" style={{ marginBottom: 24 }}>
             <div style={{ marginTop: 24, height: 400 }} id="supplierChart"></div>
             <div className="table-container">
               <div className="table-title">供应商采购排行</div>
               <Table 
                 dataSource={supplierRanking} 
                 rowKey="supplier_id" 
                 pagination={{ 
                   current: pagination.current, 
                   pageSize: pagination.pageSize, 
                   onChange: handlePaginationChange
                 }}
                 className="custom-table"
               >
                 <Column title="供应商名称" dataIndex="supplier_name" key="supplier_name" />
                 <Column title="采购金额" dataIndex="purchase_amount" key="purchase_amount" render={(text) => `¥${text}`} />
                 <Column title="订单数" dataIndex="order_count" key="order_count" />
               </Table>
             </div>
           </Card>
         )}

        {reportType === 'accounts-receivable' && (
          <Card title="应收账款账龄分析" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <h3>总应收账款</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>¥{accountsReceivable?.total || 0}</p>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <h3>7天内</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>¥{accountsReceivable?.within7Days || 0}</p>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <h3>7-30天</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>¥{accountsReceivable?.days7To30 || 0}</p>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <h3>30天以上</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>¥{(accountsReceivable?.days30To60 || 0) + (accountsReceivable?.over60Days || 0)}</p>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 24, height: 400 }} id="accountsReceivableChart"></div>
            <div className="table-container">
              <div className="table-title">应收账款明细</div>
              <Table 
                dataSource={accountsReceivable?.details} 
                rowKey="sale_id" 
                pagination={{ pageSize: 10 }}
                className="custom-table"
              >
                <Column title="客户名称" dataIndex="customer_name" key="customer_name" />
                <Column title="日期" dataIndex="date" key="date" />
                <Column title="金额" dataIndex="amount" key="amount" render={(text) => `¥${text}`} />
                <Column title="账龄(天)" dataIndex="days_age" key="days_age" />
              </Table>
            </div>
          </Card>
        )}

        {reportType === 'accounts-payable' && (
          <Card title="应付账款账龄分析" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <h3>总应付账款</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>¥{accountsPayable?.total || 0}</p>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <h3>7天内</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>¥{accountsPayable?.within7Days || 0}</p>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <h3>7-30天</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>¥{accountsPayable?.days7To30 || 0}</p>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <h3>30天以上</h3>
                  <p style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>¥{(accountsPayable?.days30To60 || 0) + (accountsPayable?.over60Days || 0)}</p>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 24, height: 400 }} id="accountsPayableChart"></div>
            <div className="table-container">
              <div className="table-title">应付账款明细</div>
              <Table 
                dataSource={accountsPayable?.details} 
                rowKey="purchase_id" 
                pagination={{ pageSize: 10 }}
                className="custom-table"
              >
                <Column title="供应商名称" dataIndex="supplier_name" key="supplier_name" />
                <Column title="日期" dataIndex="date" key="date" />
                <Column title="金额" dataIndex="amount" key="amount" render={(text) => `¥${text}`} />
                <Column title="账龄(天)" dataIndex="days_age" key="days_age" />
              </Table>
            </div>
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default Reports;