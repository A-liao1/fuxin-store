import express from 'express';
import { Op, Sequelize } from 'sequelize';
import models from '../models';

const router = express.Router();
const { Sale, SaleItem, Purchase, PurchaseItem, Inventory, Product, Customer, Supplier } = models;

// 获取经营报表
router.get('/business', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 使用聚合查询获取销售总额
    const salesResult = await Sale.sum('total_amount', {
      where: {
        date: {
          [Op.between]: [startDate as string, endDate as string]
        }
      }
    });
    
    // 使用聚合查询获取成本总额
    const saleItems = await SaleItem.findAll({
      include: [{
        model: Sale,
        as: 'Sale',
        where: {
          date: {
            [Op.between]: [startDate as string, endDate as string]
          }
        },
        attributes: []
      }],
      attributes: ['quantity', 'cost_price']
    });
    
    const costResult = saleItems.reduce((total, item) => {
      return total + (item.quantity * item.cost_price);
    }, 0);
    
    const totalSales = salesResult || 0;
    const totalCost = costResult || 0;
    const grossProfit = totalSales - totalCost;
    const grossProfitRate = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    
    res.json({
      period: {
        startDate,
        endDate
      },
      sales: totalSales,
      cost: totalCost,
      grossProfit,
      grossProfitRate: grossProfitRate.toFixed(2) + '%'
    });
  } catch (error) {
    res.status(500).json({ error: '获取经营报表失败' });
  }
});

// 获取库存价值报表
router.get('/inventory-value', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    // 获取库存数据，只选择必要字段
    const { count, rows: inventoryItems } = await Inventory.findAndCountAll({
      include: [{
        model: Product,
        as: 'Product',
        attributes: ['name', 'spec', 'unit']
      }],
      attributes: ['product_id', 'current_quantity', 'avg_cost'],
      limit: Number(pageSize),
      offset: offset
    });
    
    // 计算总库存价值
    let totalValue = 0;
    const items = inventoryItems.map(item => {
      const value = item.current_quantity * item.avg_cost;
      totalValue += value;
      return {
        product_id: item.product_id,
        product_name: (item as any).Product?.name,
        spec: (item as any).Product?.spec,
        unit: (item as any).Product?.unit,
        quantity: item.current_quantity,
        avg_cost: item.avg_cost,
        total_value: value
      };
    });
    
    res.json({
      total_value: totalValue,
      total_items: count,
      page: Number(page),
      page_size: Number(pageSize),
      items
    });
  } catch (error) {
    res.status(500).json({ error: '获取库存价值报表失败' });
  }
});

// 获取商品销售排行
router.get('/product-ranking', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 50 } = req.query;
    
    // 使用分组查询获取商品销售统计
    const saleItems = await SaleItem.findAll({
      include: [
        {
          model: Sale,
          as: 'Sale',
          where: {
            date: {
              [Op.between]: [startDate as string, endDate as string]
            }
          },
          attributes: []
        },
        {
          model: Product,
          as: 'Product',
          attributes: ['name', 'spec']
        }
      ],
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity'],
        [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'total_sales'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * cost_price')), 'total_cost']
      ],
      group: ['product_id', 'Product.id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('subtotal')), 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });
    
    // 格式化结果
    const ranking = saleItems.map(item => {
      const totalSales = Number(item.get('total_sales'));
      const totalCost = Number(item.get('total_cost'));
      return {
        product_id: item.product_id,
        product_name: (item as any).Product?.name,
        spec: (item as any).Product?.spec,
        quantity: Number(item.get('total_quantity')),
        sales_amount: totalSales,
        cost_amount: totalCost,
        profit: totalSales - totalCost
      };
    });
    
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: '获取商品销售排行失败' });
  }
});

// 获取客户销售排行
router.get('/customer-ranking', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 50 } = req.query;
    
    // 使用分组查询获取客户销售统计
    const sales = await Sale.findAll({
      where: {
        date: {
          [Op.between]: [startDate as string, endDate as string]
        }
      },
      include: [{
        model: Customer,
        as: 'Customer',
        attributes: ['name']
      }],
      attributes: [
        'customer_id',
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_sales'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'order_count']
      ],
      group: ['customer_id', 'Customer.id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('total_amount')), 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });
    
    // 格式化结果
    const ranking = sales.map(sale => ({
      customer_id: sale.customer_id,
      customer_name: (sale as any).Customer?.name,
      sales_amount: Number(sale.get('total_sales')),
      order_count: Number(sale.get('order_count'))
    }));
    
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: '获取客户销售排行失败' });
  }
});

// 获取供应商采购排行
router.get('/supplier-ranking', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 50 } = req.query;
    
    // 使用分组查询获取供应商采购统计
    const purchases = await Purchase.findAll({
      where: {
        date: {
          [Op.between]: [startDate as string, endDate as string]
        }
      },
      include: [{
        model: Supplier,
        as: 'Supplier',
        attributes: ['name']
      }],
      attributes: [
        'supplier_id',
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_purchase'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'order_count']
      ],
      group: ['supplier_id', 'Supplier.id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('total_amount')), 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });
    
    // 格式化结果
    const ranking = purchases.map(purchase => ({
      supplier_id: purchase.supplier_id,
      supplier_name: (purchase as any).Supplier?.name,
      purchase_amount: Number(purchase.get('total_purchase')),
      order_count: Number(purchase.get('order_count'))
    }));
    
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: '获取供应商采购排行失败' });
  }
});

// 获取应收账款账龄分析
router.get('/accounts-receivable', async (req, res) => {
  try {
    // 获取当前日期
    const today = new Date();
    
    // 获取未结算的销售单，只选择必要字段
    const pendingSales = await Sale.findAll({
      where: {
        settlement_status: '未结'
      },
      include: [{
        model: Customer,
        as: 'Customer',
        attributes: ['name']
      }],
      attributes: ['id', 'customer_id', 'date', 'total_amount']
    });
    
    // 分类账龄
    const agedReceivables: any = {
      total: 0,
      within7Days: 0,
      days7To30: 0,
      days30To60: 0,
      over60Days: 0,
      details: []
    };
    
    for (const sale of pendingSales) {
      const saleDate = new Date(sale.date);
      const daysDiff = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      agedReceivables.total += sale.total_amount;
      
      if (daysDiff <= 7) {
        agedReceivables.within7Days += sale.total_amount;
      } else if (daysDiff <= 30) {
        agedReceivables.days7To30 += sale.total_amount;
      } else if (daysDiff <= 60) {
        agedReceivables.days30To60 += sale.total_amount;
      } else {
        agedReceivables.over60Days += sale.total_amount;
      }
      
      agedReceivables.details.push({
        sale_id: sale.id,
        customer_name: (sale as any).Customer?.name,
        date: sale.date,
        amount: sale.total_amount,
        days_age: daysDiff,
        age_group: daysDiff <= 7 ? 'within7Days' : daysDiff <= 30 ? 'days7To30' : daysDiff <= 60 ? 'days30To60' : 'over60Days'
      });
    }
    
    res.json(agedReceivables);
  } catch (error) {
    res.status(500).json({ error: '获取应收账款账龄分析失败' });
  }
});

// 获取应付账款账龄分析
router.get('/accounts-payable', async (req, res) => {
  try {
    // 获取当前日期
    const today = new Date();
    
    // 获取未结算的采购单，只选择必要字段
    const pendingPurchases = await Purchase.findAll({
      where: {
        settlement_status: '未结'
      },
      include: [{
        model: Supplier,
        as: 'Supplier',
        attributes: ['name']
      }],
      attributes: ['id', 'supplier_id', 'date', 'total_amount']
    });
    
    // 分类账龄
    const agedPayables: any = {
      total: 0,
      within7Days: 0,
      days7To30: 0,
      days30To60: 0,
      over60Days: 0,
      details: []
    };
    
    for (const purchase of pendingPurchases) {
      const purchaseDate = new Date(purchase.date);
      const daysDiff = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      agedPayables.total += purchase.total_amount;
      
      if (daysDiff <= 7) {
        agedPayables.within7Days += purchase.total_amount;
      } else if (daysDiff <= 30) {
        agedPayables.days7To30 += purchase.total_amount;
      } else if (daysDiff <= 60) {
        agedPayables.days30To60 += purchase.total_amount;
      } else {
        agedPayables.over60Days += purchase.total_amount;
      }
      
      agedPayables.details.push({
        purchase_id: purchase.id,
        supplier_name: (purchase as any).Supplier?.name,
        date: purchase.date,
        amount: purchase.total_amount,
        days_age: daysDiff,
        age_group: daysDiff <= 7 ? 'within7Days' : daysDiff <= 30 ? 'days7To30' : daysDiff <= 60 ? 'days30To60' : 'over60Days'
      });
    }
    
    res.json(agedPayables);
  } catch (error) {
    res.status(500).json({ error: '获取应付账款账龄分析失败' });
  }
});

export default router;