import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, Input, InputNumber, message, Spin, Popconfirm } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
const { TextArea } = Input;
import { CheckOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { settlementApi } from '../services/api';
import type { Settlement, Purchase, Sale } from '../types';
import dayjs from 'dayjs';
import '../styles/table.css';

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Settlements = () => {
  const [purchaseBills, setPurchaseBills] = useState<Purchase[]>([]);
  const [saleBills, setSaleBills] = useState<Sale[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [selectedBills, setSelectedBills] = useState<any[]>([]);
  const [billType, setBillType] = useState<'purchase' | 'sale'>('purchase');
  const [form] = Form.useForm();
  const [purchaseSearchForm] = Form.useForm();
  const [saleSearchForm] = Form.useForm();
  const [settlementSearchForm] = Form.useForm();
  // 查看明细相关状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentSettlement, setCurrentSettlement] = useState<any>(null);
  // 分页相关状态
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
      const sortedBills = response.data.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setPurchaseBills(sortedBills);
    } catch (error) {
      message.error('获取应付账单失败');
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
      const sortedBills = response.data.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setSaleBills(sortedBills);
    } catch (error) {
      message.error('获取应收账款失败');
      console.error('获取应收账款失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取结算记录
  const fetchSettlements = async (params?: { supplierName?: string; customerName?: string; billType?: string; paymentMethod?: string; expressBillCode?: string; amount?: number }, pagination?: { current: number; pageSize: number }) => {
    try {
      const currentPage = pagination?.current || settlementPagination.current;
      const pageSize = pagination?.pageSize || settlementPagination.pageSize;
      
      const response = await settlementApi.getSettlements({
        ...params,
        page: currentPage,
        pageSize: pageSize
      });
      
      // 处理响应数据，确保 data 是数组
      const responseData = response.data;
      let settlementsData = [];
      let paginationData = null;
      
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        // 后端返回的是分页格式 { data: [...], pagination: {...} }
        settlementsData = responseData.data || [];
        paginationData = responseData.pagination;
      } else if (Array.isArray(responseData)) {
        // 兼容旧格式，直接返回数组
        settlementsData = responseData;
      }
      
      // 更新数据和分页信息
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
    }
  };

  useEffect(() => {
    fetchPurchaseBills();
    fetchSaleBills();
    fetchSettlements();
  }, []);

  // 打开结算模态框
  const handleSettle = (bill: Purchase | Sale, type: 'purchase' | 'sale') => {
    setSelectedBill(bill);
    setSelectedBills([bill]);
    setBillType(type);
    form.resetFields();
    form.setFieldsValue({
      settlement_date: dayjs(),
      amount: bill.total_amount,
      payment_method: '现金',
      remark: ''
    });
    setVisible(true);
  };

  // 批量打开结算模态框
  const handleBatchSettle = (bills: any[], type: 'purchase' | 'sale') => {
    setSelectedBills(bills);
    setBillType(type);
    form.resetFields();
    // 计算总金额
    const totalAmount = bills.reduce((sum, bill) => sum + bill.total_amount, 0);
    form.setFieldsValue({
      settlement_date: dayjs(),
      amount: totalAmount,
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
      
      message.success('批量结算成功');
      
      setVisible(false);
      // 刷新账单列表
      if (billType === 'purchase') {
        fetchPurchaseBills();
      } else {
        fetchSaleBills();
      }
      // 刷新结算记录，保持当前分页状态
      fetchSettlements(undefined, settlementPagination);
      // 清空选中的账单
      setSelectedBills([]);
    } catch (error) {
      message.error('结算失败，请检查输入');
      console.error('结算失败:', error);
    }
  };

  // 刷新账单
  const handleRefreshBills = () => {
    fetchPurchaseBills();
    fetchSaleBills();
    // 刷新时保持当前分页状态
    fetchSettlements(undefined, settlementPagination);
  };

  // 处理采购应付账单搜索
  const handlePurchaseSearch = async (values: any) => {
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
      
      const response = await settlementApi.getPurchaseBills(params);
      let filteredBills = response.data;
      
      // 应用日期筛选（前端）
      if (values.dateRange && values.dateRange[0]) {
        filteredBills = filteredBills.filter(bill => {
          return dayjs(bill.date).isAfter(dayjs(values.dateRange[0]).startOf('day'));
        });
      }
      
      if (values.dateRange && values.dateRange[1]) {
        filteredBills = filteredBills.filter(bill => {
          return dayjs(bill.date).isBefore(dayjs(values.dateRange[1]).endOf('day'));
        });
      }
      
      // 按照创建时间排序，最新的在前
      filteredBills.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setPurchaseBills(filteredBills);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置采购应付账单搜索
  const handlePurchaseReset = () => {
    purchaseSearchForm.resetFields();
    fetchPurchaseBills();
  };

  // 处理销售应收账款搜索
  const handleSaleSearch = async (values: any) => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (values.customerName) {
        params.customerName = values.customerName;
      }
      
      const response = await settlementApi.getSaleBills(params);
      let filteredBills = response.data;
      
      // 应用日期筛选（前端）
      if (values.dateRange && values.dateRange[0]) {
        filteredBills = filteredBills.filter(bill => {
          return dayjs(bill.date).isAfter(dayjs(values.dateRange[0]).startOf('day'));
        });
      }
      
      if (values.dateRange && values.dateRange[1]) {
        filteredBills = filteredBills.filter(bill => {
          return dayjs(bill.date).isBefore(dayjs(values.dateRange[1]).endOf('day'));
        });
      }
      
      // 按照创建时间排序，最新的在前
      filteredBills.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        } else {
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }
      });
      
      setSaleBills(filteredBills);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置销售应收账款搜索
  const handleSaleReset = () => {
    saleSearchForm.resetFields();
    fetchSaleBills();
  };

  // 处理结算记录搜索
  const handleSettlementSearch = async (values: any) => {
    try {
      const params: any = {};
      
      if (values.billType) {
        params.billType = values.billType;
      }
      
      if (values.supplierName) {
        params.supplierName = values.supplierName;
      }
      
      if (values.customerName) {
        params.customerName = values.customerName;
      }
      
      if (values.expressBillCode) {
        params.expressBillCode = values.expressBillCode;
      }
      
      if (values.amount) {
        params.amount = values.amount;
      }
      
      if (values.paymentMethod) {
        params.paymentMethod = values.paymentMethod;
      }
      
      // 重置分页到第一页
      const pagination = { current: 1, pageSize: settlementPagination.pageSize };
      await fetchSettlements(params, pagination);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    }
  };

  // 重置结算记录搜索
  const handleSettlementReset = () => {
    settlementSearchForm.resetFields();
    fetchSettlements();
  };

  // 处理查看明细
  const handleViewDetail = (record: any) => {
    setCurrentSettlement(record);
    setDetailModalVisible(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>结算管理</h1>
        <Button icon={<ReloadOutlined />} onClick={handleRefreshBills}>
          刷新账单
        </Button>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>采购应付账单</h2>
        
        {/* 采购应付账单搜索表单 */}
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Form
            form={purchaseSearchForm}
            layout="inline"
            onFinish={handlePurchaseSearch}
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
            
            <Form.Item name="totalAmount" label="应付金额" style={{ marginBottom: 0 }}>
              <InputNumber
                placeholder="请输入应付金额"
                style={{ width: 150 }}
                min={0}
                step={0.01}
                precision={2}
                allowClear
              />
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
              <Button icon={<ReloadOutlined />} onClick={handlePurchaseReset}>
                重置
              </Button>
            </Form.Item>
          </Form>
        </div>
        
        <Spin spinning={loading}>
          <div className="table-container">
            <div className="table-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              采购应付账单
              {selectedBills.length > 0 && selectedBills[0].Supplier && (
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleBatchSettle(selectedBills, 'purchase')}
                >
                  批量标记结算
                </Button>
              )}
            </div>
            <Table 
              dataSource={purchaseBills} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
              className="custom-table"
              rowSelection={{
                selectedRowKeys: selectedBills.filter(bill => bill.Supplier).map(bill => bill.id),
                onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
                  // 只允许选择同一供应商的账单
                  const filteredRows = selectedRows.filter(row => row.Supplier);
                  if (filteredRows.length > 0) {
                    const firstSupplierId = filteredRows[0].supplier_id;
                    const sameSupplierRows = filteredRows.filter(row => row.supplier_id === firstSupplierId);
                    setSelectedBills(sameSupplierRows);
                  } else {
                    setSelectedBills([]);
                  }
                },
                selections: [
                  {
                    key: 'all-data',
                    text: '全选同一供应商账单',
                    onSelect: (changeableRowKeys) => {
                      const allRows = purchaseBills.filter(row => row.Supplier);
                      if (allRows.length > 0) {
                        const firstSupplierId = allRows[0].supplier_id;
                        const sameSupplierRows = allRows.filter(row => row.supplier_id === firstSupplierId);
                        setSelectedBills(sameSupplierRows);
                      }
                    },
                  },
                ],
              }}
            >
              <Column title="入库单号" dataIndex="id" key="id" ellipsis />
              <Column title="快递单号" dataIndex="express_bill_code" key="express_bill_code" ellipsis render={(text) => text || '-'}/>
              <Column 
                title="供应商" 
                dataIndex="Supplier" 
                key="supplier" 
                render={(supplier) => supplier?.name || ''} 
              />
              <Column title="入库日期" dataIndex="date" key="date" render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')} />
              <Column title="应付金额" dataIndex="total_amount" key="total_amount" render={(text) => `¥${text}`} />
              <Column title="备注" dataIndex="remark" key="remark" ellipsis render={(text) => text || '-'}/>
              <Column 
                title="操作" 
                key="action" 
                render={(_, record) => (
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />} 
                    onClick={() => handleSettle(record, 'purchase')}
                    disabled={!record.Supplier}
                  >
                    标记结算
                  </Button>
                )} 
              />
            </Table>
          </div>
        </Spin>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>销售应收账款</h2>
        
        {/* 销售应收账款搜索表单 */}
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Form
            form={saleSearchForm}
            layout="inline"
            onFinish={handleSaleSearch}
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
              <Button icon={<ReloadOutlined />} onClick={handleSaleReset}>
                重置
              </Button>
            </Form.Item>
          </Form>
        </div>
        
        <Spin spinning={loading}>
          <div className="table-container">
            <div className="table-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              销售应收账款
              {selectedBills.length > 0 && selectedBills[0].Customer && (
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleBatchSettle(selectedBills, 'sale')}
                >
                  批量标记收款
                </Button>
              )}
            </div>
            <Table 
              dataSource={saleBills} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
              className="custom-table"
              rowSelection={{
                selectedRowKeys: selectedBills.filter(bill => bill.Customer).map(bill => bill.id),
                onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
                  // 只允许选择同一客户的账单
                  const filteredRows = selectedRows.filter(row => row.Customer);
                  if (filteredRows.length > 0) {
                    const firstCustomerId = filteredRows[0].customer_id;
                    const sameCustomerRows = filteredRows.filter(row => row.customer_id === firstCustomerId);
                    setSelectedBills(sameCustomerRows);
                  } else {
                    setSelectedBills([]);
                  }
                },
                selections: [
                  {
                    key: 'all-data',
                    text: '全选同一客户账单',
                    onSelect: (changeableRowKeys) => {
                      const allRows = saleBills.filter(row => row.Customer);
                      if (allRows.length > 0) {
                        const firstCustomerId = allRows[0].customer_id;
                        const sameCustomerRows = allRows.filter(row => row.customer_id === firstCustomerId);
                        setSelectedBills(sameCustomerRows);
                      }
                    },
                  },
                ],
              }}
            >
              <Column title="出库单号" dataIndex="id" key="id" ellipsis />
              <Column 
                title="客户" 
                dataIndex="Customer" 
                key="customer" 
                render={(customer) => customer?.name || ''} 
              />
              <Column title="出库日期" dataIndex="date" key="date" render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')} />
              <Column title="应收金额" dataIndex="total_amount" key="total_amount" render={(text) => `¥${text}`} />
              <Column title="备注" dataIndex="remark" key="remark" ellipsis render={(text) => text || '-'}/>
              <Column 
                title="操作" 
                key="action" 
                render={(_, record) => (
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />} 
                    onClick={() => handleSettle(record, 'sale')}
                    disabled={!record.Customer}
                  >
                    标记收款
                  </Button>
                )} 
              />
            </Table>
          </div>
        </Spin>
      </div>
      
      <div>
        <h2 style={{ marginBottom: 16 }}>结算记录</h2>
        
        {/* 结算记录搜索表单 */}
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Form
            form={settlementSearchForm}
            layout="inline"
            onFinish={handleSettlementSearch}
            style={{ width: '100%' }}
          >
            <Form.Item name="billType" label="单据类型" style={{ marginBottom: 0 }}>
              <Select
                placeholder="请选择单据类型"
                style={{ width: 150 }}
                allowClear
              >
                <Select.Option value="purchase">采购单</Select.Option>
                <Select.Option value="sale">销售单</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="supplierName" label="供应商名称" style={{ marginBottom: 0 }}>
              <Input
                placeholder="请输入供应商名称"
                style={{ width: 150 }}
                allowClear
              />
            </Form.Item>
            
            <Form.Item name="customerName" label="客户名称" style={{ marginBottom: 0 }}>
              <Input
                placeholder="请输入客户名称"
                style={{ width: 150 }}
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
            
            <Form.Item name="amount" label="应付金额" style={{ marginBottom: 0 }}>
              <InputNumber
                placeholder="请输入应付金额"
                style={{ width: 150 }}
                min={0}
                step={0.01}
                precision={2}
                allowClear
              />
            </Form.Item>
            
            <Form.Item name="dateRange" label="结算日期" style={{ marginBottom: 0 }}>
              <RangePicker
                style={{ width: 300 }}
                placeholder={['开始日期', '结束日期']}
                showTime={{ format: 'HH:mm:ss' }}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Form.Item>
            
            <Form.Item name="paymentMethod" label="支付方式" style={{ marginBottom: 0 }}>
              <Select
                placeholder="请选择支付方式"
                style={{ width: 150 }}
                allowClear
              >
                <Select.Option value="现金">现金</Select.Option>
                <Select.Option value="银行转账">银行转账</Select.Option>
                <Select.Option value="支付宝">支付宝</Select.Option>
                <Select.Option value="微信">微信</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                搜索
              </Button>
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0 }}>
              <Button icon={<ReloadOutlined />} onClick={handleSettlementReset}>
                重置
              </Button>
            </Form.Item>
          </Form>
        </div>
        
        <div className="table-container">
          <div className="table-title">结算记录</div>
          <Table 
              dataSource={settlements} 
              rowKey="id" 
              pagination={{
                current: settlementPagination.current,
                pageSize: settlementPagination.pageSize,
                total: settlementPagination.total,
                onChange: (page, pageSize) => {
                  fetchSettlements(undefined, { current: page, pageSize });
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              className="custom-table"
            >
              <Column title="单据类型" dataIndex="bill_type" key="bill_type" render={(type) => type === 'purchase' ? '采购单' : '销售单'} />
              <Column title="单据编号" dataIndex="bill_id" key="bill_id" ellipsis />
              <Column title="快递单号" dataIndex="express_bill_code" key="express_bill_code" ellipsis render={(text) => text || '-'}/>
            <Column 
              title="供应商/客户" 
              key="supplier_customer" 
              render={(record) => {
                if (record.bill_type === 'purchase' && record.supplier) {
                  return record.supplier.name;
                } else if (record.bill_type === 'sale' && record.customer) {
                  return record.customer.name;
                }
                return '-';
              }} 
            />
            <Column title="结算日期" dataIndex="settlement_date" key="settlement_date" render={(text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')} />
            <Column title="结算金额" dataIndex="amount" key="amount" render={(text) => `¥${text}`} />
            <Column title="支付方式" dataIndex="payment_method" key="payment_method" />
            <Column title="备注" dataIndex="remark" key="remark" render={(text) => text || '-' } />
            <Column 
              title="操作" 
              key="action" 
              render={(_, record) => (
                <Button 
                  icon={<EyeOutlined />} 
                  onClick={() => handleViewDetail(record)}
                >
                  查看明细
                </Button>
              )} 
            />
          </Table>
        </div>
      </div>

      {/* 结算模态框 */}
      <Modal
        title={billType === 'purchase' ? '采购单结算' : '销售单收款'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
      >
        {/* 多笔账单明细 */}
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <h3 style={{ marginBottom: 12 }}>账单明细</h3>
          {selectedBills.map((bill, index) => (
            <div key={bill.id} style={{ marginBottom: 20, padding: 12, backgroundColor: '#fff', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <strong>{billType === 'purchase' ? '入库单' : '出库单'}:</strong> {bill.id}
                </div>
                <div>
                  <strong>日期:</strong> {dayjs(bill.date).format('YYYY-MM-DD')}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>{billType === 'purchase' ? '供应商' : '客户'}:</strong> {billType === 'purchase' ? bill.Supplier?.name : bill.Customer?.name || '-'}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>{billType === 'purchase' ? '应付金额' : '应收金额'}:</strong> ¥{bill.total_amount}
              </div>
              {/* 商品明细 */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8 }}>商品明细：</h4>
                <Table 
                  dataSource={(() => {
                    const items = (bill.PurchaseItems || bill.SaleItems) || [];
                    // 计算合计
                    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                    const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
                    // 添加合计行
                    return [
                      ...items,
                      {
                        id: 'total',
                        isTotal: true,
                        quantity: totalQuantity,
                        subtotal: totalSubtotal
                      }
                    ];
                  })()} 
                  rowKey="id" 
                  pagination={false}
                  size="small"
                >
                  <Column 
                    title="商品名称" 
                    dataIndex="Product" 
                    key="product" 
                    render={(product, record) => record.isTotal ? '合计' : `${product?.name || ''} ${product?.spec || ''}`} 
                    width={300}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="单价" 
                    dataIndex="price" 
                    key="price" 
                    render={(text, record) => record.isTotal ? '' : `¥${text}`} 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="数量" 
                    dataIndex="quantity" 
                    key="quantity" 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="小计" 
                    dataIndex="subtotal" 
                    key="subtotal" 
                    render={(text, record) => `¥${text}`} 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                </Table>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <strong>汇总金额：</strong>
            <span style={{ color: '#ff4d4f', marginLeft: 8, fontSize: '16px' }}>
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
              defaultValue={dayjs().format('YYYY-MM-DD HH:mm:ss')}
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

      {/* 查看明细模态框 */}
      <Modal
        title="商品明细"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
        {currentSettlement && (
          <div>
            <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <strong>单据类型</strong> {currentSettlement.bill_type === 'purchase' ? '采购单' : '销售单'}
                </div>
                <div>
                  <strong>单据编号</strong> {currentSettlement.bill_id}
                </div>
                <div>
                  <strong>快递单号</strong> {currentSettlement.express_bill_code || '-'}
                </div>
                <div>
                  <strong>结算日期</strong> {dayjs(currentSettlement.settlement_date).format('YYYY-MM-DD HH:mm:ss')}
                </div>
              </div>
            </div>
            
            {/* 商品明细表格 */}
            <div className="table-container">
              <div className="table-title">商品明细</div>
              {currentSettlement && (
                <Table 
                  dataSource={
                    (() => {
                      const items = currentSettlement.bill_type === 'purchase' 
                        ? currentSettlement.bill?.PurchaseItems || []
                        : currentSettlement.bill?.SaleItems || [];
                      
                      // 计算合计
                      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
                      
                      // 添加合计行
                      return [
                        ...items,
                        {
                          id: 'total',
                          isTotal: true,
                          quantity: totalQuantity,
                          subtotal: totalSubtotal
                        }
                      ];
                    })()
                  } 
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
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="规格" 
                    dataIndex="Product" 
                    key="spec" 
                    render={(product, record) => record.isTotal ? '' : (product?.spec || '')} 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="单价" 
                    dataIndex="price" 
                    key="price" 
                    render={(text, record) => record.isTotal ? '' : `¥${text}`} 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="数量" 
                    dataIndex="quantity" 
                    key="quantity" 
                    render={(text, record) => record.isTotal ? text : text} 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                  <Column 
                    title="小计" 
                    dataIndex="subtotal" 
                    key="subtotal" 
                    render={(text, record) => record.isTotal ? `¥${text}` : `¥${text}`} 
                    width={100}
                    onCell={(record) => ({ style: record.isTotal ? { fontWeight: 'bold', color: '#ff4d4f' } : {} })}
                  />
                </Table>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Settlements;