import { useState, useEffect } from 'react';
import { Card, Table, Spin, Alert, Select, Input, DatePicker, Button, Modal, Form } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import { settlementApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { TextArea } = Input;

const MobileSettlements = () => {
  const [purchaseBills, setPurchaseBills] = useState<any[]>([]);
  const [saleBills, setSaleBills] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [selectedBills, setSelectedBills] = useState<any[]>([]);
  const [billType, setBillType] = useState<'purchase' | 'sale'>('purchase');
  const [activeTab, setActiveTab] = useState<'purchase' | 'sale' | 'settlements'>('purchase');
  const [form] = Form.useForm();
  
  // 搜索参数
  const [purchaseSearchParams, setPurchaseSearchParams] = useState({
    supplierName: '',
    dateRange: null as any
  });
  
  const [saleSearchParams, setSaleSearchParams] = useState({
    customerName: '',
    dateRange: null as any
  });
  
  const [settlementSearchParams, setSettlementSearchParams] = useState({
    billType: '',
    supplierName: '',
    expressBillCode: '',
    dateRange: null as any
  });
  
  // 分页状态
  const [settlementPagination, setSettlementPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取采购应付账单
  const fetchPurchaseBills = async (supplierName?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (supplierName) {
        params.supplierName = supplierName;
      }
      const response = await settlementApi.getPurchaseBills(params);
      
      // 按照创建时间排序，最新的在前
      const sortedBills = response.data.sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setPurchaseBills(sortedBills);
    } catch (error) {
      console.error('获取应付账单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取销售应收账款
  const fetchSaleBills = async (customerName?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (customerName) {
        params.customerName = customerName;
      }
      const response = await settlementApi.getSaleBills(params);
      
      // 按照创建时间排序，最新的在前
      const sortedBills = response.data.sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setSaleBills(sortedBills);
    } catch (error) {
      console.error('获取应收账款失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取结算记录
  const fetchSettlements = async (params?: any, pagination?: { current: number; pageSize: number }) => {
    try {
      setLoading(true);
      const currentPage = pagination?.current || settlementPagination.current;
      const pageSize = pagination?.pageSize || settlementPagination.pageSize;
      
      const response = await settlementApi.getSettlements({
        ...params,
        page: currentPage,
        pageSize: pageSize
      });
      
      // 处理响应数据
      const responseData = response.data;
      let settlementsData = [];
      let paginationData = null;
      
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        settlementsData = responseData.data || [];
        paginationData = responseData.pagination;
      } else if (Array.isArray(responseData)) {
        settlementsData = responseData;
      }
      
      setSettlements(settlementsData);
      if (paginationData) {
        setSettlementPagination({
          current: paginationData.page || currentPage,
          pageSize: paginationData.pageSize || pageSize,
          total: paginationData.total || 0
        });
      }
    } catch (error) {
      console.error('获取结算记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseBills();
    fetchSaleBills();
    fetchSettlements();
  }, []);

  // 打开结算模态框
  const handleSettle = (bill: any, type: 'purchase' | 'sale') => {
    setSelectedBills([bill]);
    setBillType(type);
    form.resetFields();
    form.setFieldsValue({
      settlement_date: dayjs(),
      payment_method: '现金',
      remark: ''
    });
    setVisible(true);
  };

  // 提交结算
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 为每笔选中的账单创建结算记录
      for (const bill of selectedBills) {
        const settlementData = {
          bill_type: billType,
          bill_id: bill.id,
          settlement_date: values.settlement_date,
          amount: bill.total_amount,
          payment_method: values.payment_method,
          remark: values.remark || ''
        };
        
        await settlementApi.createSettlement(settlementData);
      }
      
      setVisible(false);
      // 刷新账单列表
      if (billType === 'purchase') {
        fetchPurchaseBills();
      } else {
        fetchSaleBills();
      }
      // 刷新结算记录
      fetchSettlements();
      // 清空选中的账单
      setSelectedBills([]);
    } catch (error) {
      console.error('结算失败:', error);
    }
  };

  // 刷新账单
  const handleRefreshBills = () => {
    fetchPurchaseBills();
    fetchSaleBills();
    fetchSettlements();
  };

  // 处理采购应付账单搜索
  const handlePurchaseSearch = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (purchaseSearchParams.supplierName) {
        params.supplierName = purchaseSearchParams.supplierName;
      }
      
      const response = await settlementApi.getPurchaseBills(params);
      let filteredBills = response.data;
      
      // 应用日期筛选（前端）
      if (purchaseSearchParams.dateRange && purchaseSearchParams.dateRange[0]) {
        filteredBills = filteredBills.filter((bill: any) => {
          return dayjs(bill.date).isAfter(dayjs(purchaseSearchParams.dateRange[0]).startOf('day'));
        });
      }
      
      if (purchaseSearchParams.dateRange && purchaseSearchParams.dateRange[1]) {
        filteredBills = filteredBills.filter((bill: any) => {
          return dayjs(bill.date).isBefore(dayjs(purchaseSearchParams.dateRange[1]).endOf('day'));
        });
      }
      
      // 按照创建时间排序，最新的在前
      filteredBills.sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setPurchaseBills(filteredBills);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置采购应付账单搜索
  const handlePurchaseReset = () => {
    setPurchaseSearchParams({
      supplierName: '',
      dateRange: null
    });
    fetchPurchaseBills();
  };

  // 处理销售应收账款搜索
  const handleSaleSearch = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (saleSearchParams.customerName) {
        params.customerName = saleSearchParams.customerName;
      }
      
      const response = await settlementApi.getSaleBills(params);
      let filteredBills = response.data;
      
      // 应用日期筛选（前端）
      if (saleSearchParams.dateRange && saleSearchParams.dateRange[0]) {
        filteredBills = filteredBills.filter((bill: any) => {
          return dayjs(bill.date).isAfter(dayjs(saleSearchParams.dateRange[0]).startOf('day'));
        });
      }
      
      if (saleSearchParams.dateRange && saleSearchParams.dateRange[1]) {
        filteredBills = filteredBills.filter((bill: any) => {
          return dayjs(bill.date).isBefore(dayjs(saleSearchParams.dateRange[1]).endOf('day'));
        });
      }
      
      // 按照创建时间排序，最新的在前
      filteredBills.sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setSaleBills(filteredBills);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置销售应收账款搜索
  const handleSaleReset = () => {
    setSaleSearchParams({
      customerName: '',
      dateRange: null
    });
    fetchSaleBills();
  };

  // 处理结算记录搜索
  const handleSettlementSearch = async () => {
    try {
      const params: any = {};
      
      if (settlementSearchParams.billType) {
        params.billType = settlementSearchParams.billType;
      }
      
      if (settlementSearchParams.supplierName) {
        params.supplierName = settlementSearchParams.supplierName;
      }
      
      if (settlementSearchParams.expressBillCode) {
        params.expressBillCode = settlementSearchParams.expressBillCode;
      }
      
      // 重置分页到第一页
      const pagination = { current: 1, pageSize: settlementPagination.pageSize };
      await fetchSettlements(params, pagination);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  // 重置结算记录搜索
  const handleSettlementReset = () => {
    setSettlementSearchParams({
      billType: '',
      supplierName: '',
      expressBillCode: '',
      dateRange: null
    });
    fetchSettlements();
  };

  // 处理分页变化
  const handlePaginationChange = (page: number, pageSize: number) => {
    setSettlementPagination({ ...settlementPagination, current: page, pageSize });
    fetchSettlements(settlementSearchParams, { current: page, pageSize });
  };

  // 采购应付账单列
  const purchaseColumns = [
    {
      title: '供应商',
      dataIndex: 'Supplier',
      key: 'supplier',
      render: (supplier: any) => supplier?.name || '',
    },
    {
      title: '入库日期',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '应付金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (text: number) => `¥${text}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          icon={<CheckOutlined />} 
          size="small"
          onClick={() => handleSettle(record, 'purchase')}
          disabled={!record.Supplier}
        >
          标记结算
        </Button>
      ),
    },
  ];

  // 销售应收账款列
  const saleColumns = [
    {
      title: '客户',
      dataIndex: 'Customer',
      key: 'customer',
      render: (customer: any) => customer?.name || '',
    },
    {
      title: '出库日期',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '应收金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (text: number) => `¥${text}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          icon={<CheckOutlined />} 
          size="small"
          onClick={() => handleSettle(record, 'sale')}
          disabled={!record.Customer}
        >
          标记收款
        </Button>
      ),
    },
  ];

  // 结算记录列
  const settlementColumns = [
    {
      title: '单据类型',
      dataIndex: 'bill_type',
      key: 'bill_type',
      render: (type: string) => type === 'purchase' ? '采购单' : '销售单',
    },
    {
      title: '结算金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
    },
    {
      title: '结算日期',
      dataIndex: 'settlement_date',
      key: 'settlement_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 标签页切换 */}
      <div style={{ display: 'flex', marginBottom: 16, borderBottom: '1px solid #e8e8e8' }}>
        <button
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'purchase' ? '#1890ff' : 'transparent',
            color: activeTab === 'purchase' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'purchase' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('purchase')}
        >
          采购应付
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'sale' ? '#1890ff' : 'transparent',
            color: activeTab === 'sale' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'sale' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('sale')}
        >
          销售应收
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'settlements' ? '#1890ff' : 'transparent',
            color: activeTab === 'settlements' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'settlements' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('settlements')}
        >
          结算记录
        </button>
      </div>

      {/* 刷新按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={handleRefreshBills} size="small">
          刷新
        </Button>
      </div>

      {/* 采购应付账单 */}
      {activeTab === 'purchase' && (
        <div>
          {/* 搜索条件 */}
          <Card title="搜索条件" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Search
                placeholder="供应商名称"
                value={purchaseSearchParams.supplierName}
                onChange={(e) => setPurchaseSearchParams({ ...purchaseSearchParams, supplierName: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <RangePicker 
                style={{ width: '100%' }}
                value={purchaseSearchParams.dateRange}
                onChange={(dates) => setPurchaseSearchParams({ ...purchaseSearchParams, dateRange: dates })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={handlePurchaseSearch}
              >
                搜索
              </button>
              <button 
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={handlePurchaseReset}
              >
                重置
              </button>
            </div>
          </Card>

          {/* 采购应付账单列表 */}
          <Card title="采购应付账单" style={{ marginBottom: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : purchaseBills.length > 0 ? (
              <Table 
                dataSource={purchaseBills} 
                rowKey="id" 
                columns={purchaseColumns} 
                pagination={{ 
                  pageSize: 10, 
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`
                }}
                size="small"
              />
            ) : (
              <Alert 
                message="暂无应付账单" 
                type="info" 
                showIcon 
                style={{ margin: '20px 0' }}
              />
            )}
          </Card>
        </div>
      )}

      {/* 销售应收账款 */}
      {activeTab === 'sale' && (
        <div>
          {/* 搜索条件 */}
          <Card title="搜索条件" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Search
                placeholder="客户名称"
                value={saleSearchParams.customerName}
                onChange={(e) => setSaleSearchParams({ ...saleSearchParams, customerName: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <RangePicker 
                style={{ width: '100%' }}
                value={saleSearchParams.dateRange}
                onChange={(dates) => setSaleSearchParams({ ...saleSearchParams, dateRange: dates })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={handleSaleSearch}
              >
                搜索
              </button>
              <button 
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={handleSaleReset}
              >
                重置
              </button>
            </div>
          </Card>

          {/* 销售应收账款列表 */}
          <Card title="销售应收账款" style={{ marginBottom: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : saleBills.length > 0 ? (
              <Table 
                dataSource={saleBills} 
                rowKey="id" 
                columns={saleColumns} 
                pagination={{ 
                  pageSize: 10, 
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`
                }}
                size="small"
              />
            ) : (
              <Alert 
                message="暂无应收账款" 
                type="info" 
                showIcon 
                style={{ margin: '20px 0' }}
              />
            )}
          </Card>
        </div>
      )}

      {/* 结算记录 */}
      {activeTab === 'settlements' && (
        <div>
          {/* 搜索条件 */}
          <Card title="搜索条件" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Select
                placeholder="单据类型"
                style={{ width: '100%' }}
                value={settlementSearchParams.billType}
                onChange={(value) => setSettlementSearchParams({ ...settlementSearchParams, billType: value })}
              >
                <Option value="purchase">采购单</Option>
                <Option value="sale">销售单</Option>
              </Select>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <Search
                placeholder="供应商名称"
                value={settlementSearchParams.supplierName}
                onChange={(e) => setSettlementSearchParams({ ...settlementSearchParams, supplierName: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <Search
                placeholder="快递单号"
                value={settlementSearchParams.expressBillCode}
                onChange={(e) => setSettlementSearchParams({ ...settlementSearchParams, expressBillCode: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <RangePicker 
                style={{ width: '100%' }}
                value={settlementSearchParams.dateRange}
                onChange={(dates) => setSettlementSearchParams({ ...settlementSearchParams, dateRange: dates })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={handleSettlementSearch}
              >
                搜索
              </button>
              <button 
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={handleSettlementReset}
              >
                重置
              </button>
            </div>
          </Card>

          {/* 结算记录列表 */}
          <Card title="结算记录" style={{ marginBottom: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : settlements.length > 0 ? (
              <Table 
                dataSource={settlements} 
                rowKey="id" 
                columns={settlementColumns} 
                pagination={{
                  current: settlementPagination.current,
                  pageSize: settlementPagination.pageSize,
                  total: settlementPagination.total,
                  onChange: handlePaginationChange,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`
                }}
                size="small"
              />
            ) : (
              <Alert 
                message="暂无结算记录" 
                type="info" 
                showIcon 
                style={{ margin: '20px 0' }}
              />
            )}
          </Card>
        </div>
      )}

      {/* 结算模态框 */}
      <Modal
        title={billType === 'purchase' ? '采购单结算' : '销售单收款'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText="确定"
        cancelText="取消"
        width={320}
      >
        {/* 多笔账单明细 */}
        <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <h3 style={{ marginBottom: 12, fontSize: '14px', fontWeight: 'bold' }}>账单明细</h3>
          {selectedBills.map((bill, index) => (
            <div key={bill.id} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '12px', marginBottom: 8, color: '#666' }}>
                {billType === 'purchase' ? '入库单' : '出库单'}: {bill.id?.substring(0, 8) || '-'}
              </div>
              <div style={{ fontSize: '14px', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>{billType === 'purchase' ? '供应商' : '客户'}：</span>
                {billType === 'purchase' ? bill.Supplier?.name : bill.Customer?.name || '-'}
              </div>
              <div style={{ fontSize: '14px', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>日期：</span>
                {dayjs(bill.date).format('YYYY-MM-DD')}
              </div>
              <div style={{ fontSize: '14px', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>{billType === 'purchase' ? '应付金额' : '应收金额'}：</span>
                ¥{bill.total_amount}
              </div>
              {/* 商品明细 */}
              <div style={{ marginTop: 8, fontSize: '12px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>商品明细：</div>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {bill.PurchaseItems || bill.SaleItems ? (
                    <> 
                      {(bill.PurchaseItems || bill.SaleItems).map((item: any, itemIndex: number) => (
                        <div key={item.id || itemIndex} style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.Product?.name || ''} {item.Product?.spec || ''}
                          </div>
                          <div style={{ marginLeft: 8, textAlign: 'right' }}>
                            {item.quantity} × ¥{item.price} = ¥{item.subtotal}
                          </div>
                        </div>
                      ))}

                    </>
                  ) : (
                    <div style={{ color: '#999' }}>暂无商品明细</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, textAlign: 'right', fontSize: '14px' }}>
            <strong>汇总金额：</strong>
            <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
              ¥{selectedBills.reduce((sum, bill) => sum + bill.total_amount, 0)}
            </span>
          </div>
        </div>
        
        <Form form={form} layout="vertical">
          <Form.Item 
            name="settlement_date" 
            label="结算日期" 
            rules={[{ required: true, message: '请选择结算日期' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              showTime={{ format: 'HH:mm:ss' }} 
              format="YYYY-MM-DD HH:mm:ss" 
              defaultValue={dayjs()}
            />
          </Form.Item>
          <Form.Item 
            name="payment_method" 
            label="支付方式" 
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              <Option value="现金">现金</Option>
              <Option value="银行转账">银行转账</Option>
              <Option value="支付宝">支付宝</Option>
              <Option value="微信">微信</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="remark" 
            label="备注" 
            rules={[]}
          >
            <TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MobileSettlements;