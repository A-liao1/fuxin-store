import express from 'express';
import { Op } from 'sequelize';
import models from '../models';

const router = express.Router();
const { Settlement, Purchase, Sale, Supplier, Customer } = models;

// 获取所有结算记录（带分页）
router.get('/', async (req, res) => {
  try {
    const { supplierName, customerName, billType, paymentMethod, expressBillCode, amount, page = 1, pageSize = 10 } = req.query;
    
    console.log('开始获取结算记录，查询参数:', { supplierName, customerName, billType, paymentMethod, expressBillCode, amount, page, pageSize });
    
    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * size;
    
    const whereClause: any = {};
    
    // 单据类型过滤
    if (billType && typeof billType === 'string') {
      whereClause.bill_type = billType;
    }
    
    // 支付方式过滤
    if (paymentMethod && typeof paymentMethod === 'string') {
      whereClause.payment_method = paymentMethod;
    }
    
    // 快递单号过滤
    if (expressBillCode && typeof expressBillCode === 'string') {
      whereClause.express_bill_code = {
        [Op.like]: `%${expressBillCode}%`
      };
    }
    
    // 应付金额过滤
    if (amount && !isNaN(Number(amount))) {
      whereClause.amount = Number(amount);
    }
    
    // 获取所有符合条件的结算记录
    const allSettlements = await Settlement.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    // 为每个结算记录添加关联的单据信息
    let settlementsWithDetails = await Promise.all(
      allSettlements.map(async (settlement) => {
        try {
          if (settlement.bill_type === 'purchase') {
            const purchase = await Purchase.findByPk(settlement.bill_id, {
              include: [
                { model: Supplier, as: 'Supplier' },
                { model: models.PurchaseItem, as: 'PurchaseItems', include: [{ model: models.Product, as: 'Product' }] }
              ]
            });
            return {
              ...settlement.toJSON(),
              bill: purchase,
              supplier: (purchase as any)?.Supplier
            };
          } else if (settlement.bill_type === 'sale') {
            const sale = await Sale.findByPk(settlement.bill_id, {
              include: [
                { model: Customer, as: 'Customer' },
                { model: models.SaleItem, as: 'SaleItems', include: [{ model: models.Product, as: 'Product' }] }
              ]
            });
            return {
              ...settlement.toJSON(),
              bill: sale,
              customer: (sale as any)?.Customer
            };
          }
          return settlement.toJSON();
        } catch (error) {
          console.error('处理结算记录时出错:', error);
          return settlement.toJSON();
        }
      })
    );
    
    // 过滤供应商和客户名称
    if (supplierName && typeof supplierName === 'string') {
      settlementsWithDetails = settlementsWithDetails.filter((s: any) => 
        s.supplier && s.supplier.name && s.supplier.name.includes(supplierName)
      );
    }
    
    if (customerName && typeof customerName === 'string') {
      settlementsWithDetails = settlementsWithDetails.filter((s: any) => 
        s.customer && s.customer.name && s.customer.name.includes(customerName)
      );
    }
    
    // 计算过滤后的总记录数
    const total = settlementsWithDetails.length;
    
    // 进行分页
    const paginatedData = settlementsWithDetails.slice(offset, offset + size);
    
    console.log('处理完成，返回结算记录:', { total, page: pageNum, pageSize: size, filteredCount: settlementsWithDetails.length, returnedCount: paginatedData.length });
    res.json({
      data: paginatedData,
      pagination: {
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('获取结算记录失败:', error);
    res.status(500).json({ error: '获取结算记录失败', details: (error as any).message });
  }
});

// 创建结算记录
router.post('/', async (req, res) => {
  try {
    const { bill_type, bill_id, settlement_date, amount, payment_method, remark } = req.body;
    
    // 检查是否是采购单结算，如果是，从采购单中获取快递单号
    let express_bill_code = undefined;
    if (bill_type === 'purchase') {
      const purchase = await Purchase.findByPk(bill_id);
      if (purchase) {
        express_bill_code = purchase.express_bill_code;
      }
    }
    
    // 创建结算记录
    const settlement = await Settlement.create({
      bill_type,
      bill_id,
      settlement_date,
      amount,
      payment_method,
      remark,
      express_bill_code
    } as any);
    
    // 更新对应单据的结算状态
    if (bill_type === 'purchase') {
      const purchase = await Purchase.findByPk(bill_id);
      if (purchase) {
        await purchase.update({ settlement_status: '已结' });
      }
    } else if (bill_type === 'sale') {
      const sale = await Sale.findByPk(bill_id);
      if (sale) {
        await sale.update({ settlement_status: '已结' });
      }
    }
    
    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ error: '创建结算记录失败' });
  }
});

// 获取采购应付账单
router.get('/purchase-bills', async (req, res) => {
  try {
    const { supplierName, expressBillCode, totalAmount } = req.query;
    
    const whereClause: any = {
      settlement_status: '未结'
    };
    
    const includeOptions: any[] = [];
    
    // 如果有供应商名称搜索参数
    if (supplierName && typeof supplierName === 'string') {
      includeOptions.push({
        model: Supplier,
        as: 'Supplier',
        where: {
          name: {
            [Op.like]: `%${supplierName}%`
          }
        },
        required: true
      });
    } else {
      includeOptions.push({
        model: Supplier,
        as: 'Supplier'
      });
    }
    
    // 如果有快递单号搜索参数
    if (expressBillCode && typeof expressBillCode === 'string') {
      whereClause.express_bill_code = {
        [Op.like]: `%${expressBillCode}%`
      };
    }
    
    // 如果有应付金额搜索参数
    if (totalAmount && !isNaN(Number(totalAmount))) {
      whereClause.total_amount = Number(totalAmount);
    }
    
    const bills = await Purchase.findAll({
      where: whereClause,
      include: [
        ...includeOptions,
        { model: models.PurchaseItem, as: 'PurchaseItems', include: [{ model: models.Product, as: 'Product' }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bills);
  } catch (error) {
    console.error('获取应付账单失败:', error);
    res.status(500).json({ error: '获取应付账单失败' });
  }
});

// 获取销售应收账款
router.get('/sale-bills', async (req, res) => {
  try {
    const { customerName } = req.query;
    
    const includeOptions: any[] = [];
    
    // 如果有客户名称搜索参数
    if (customerName && typeof customerName === 'string') {
      includeOptions.push({
        model: Customer,
        as: 'Customer',
        where: {
          name: {
            [Op.like]: `%${customerName}%`
          }
        },
        required: true
      });
    } else {
      includeOptions.push({
        model: Customer,
        as: 'Customer'
      });
    }
    
    const bills = await Sale.findAll({
      where: { settlement_status: '未结' },
      include: [
        ...includeOptions,
        { model: models.SaleItem, as: 'SaleItems', include: [{ model: models.Product, as: 'Product' }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bills);
  } catch (error) {
    console.error('获取应收账款失败:', error);
    res.status(500).json({ error: '获取应收账款失败' });
  }
});

export default router;