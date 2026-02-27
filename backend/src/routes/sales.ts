import express from 'express';
import { Op } from 'sequelize';
import models from '../models';

const router = express.Router();
const { Sale, SaleItem, Product, Inventory, InventoryLog, Customer } = models;

// 获取所有销售单
router.get('/', async (req, res) => {
  try {
    const { customerName } = req.query;
    
    // 构建查询条件
    const whereClause: any = {};
    const includeOptions: any[] = [
      { model: SaleItem, as: 'SaleItems', include: [{ model: Product, as: 'Product' }] }
    ];
    
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
        required: true // INNER JOIN，只返回匹配的记录
      });
    } else {
      includeOptions.push({
        model: Customer,
        as: 'Customer'
      });
    }
    
    const sales = await Sale.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['date', 'DESC'], ['id', 'DESC']]
    });
    
    res.json(sales);
  } catch (error) {
    console.error('获取销售单列表失败:', error);
    res.status(500).json({ error: '获取销售单列表失败' });
  }
});

// 获取单个销售单
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: SaleItem, as: 'SaleItems', include: [{ model: Product, as: 'Product' }] },
        { model: models.Customer, as: 'Customer' }
      ]
    });
    if (!sale) {
      return res.status(404).json({ error: '销售单不存在' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: '获取销售单详情失败' });
  }
});

// 创建销售单
router.post('/', async (req, res) => {
  try {
    const { customer_id, date, items, operator, remark } = req.body;
    
    // 计算总金额
    const total_amount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    
    // 创建销售单
    const sale = await Sale.create({
      customer_id,
      date,
      total_amount,
      settlement_status: '未结',
      operator,
      remark
    } as any);
    
    // 处理销售明细和库存更新
    for (const item of items) {
      // 检查库存
      const inventory = await Inventory.findOne({ where: { product_id: item.product_id } });
      if (!inventory || inventory.current_quantity < item.quantity) {
        throw new Error('库存不足');
      }
      
      // 创建销售明细，记录当前成本价
      await SaleItem.create({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        cost_price: inventory.avg_cost
      } as any);
      
      // 更新库存
      const new_quantity = inventory.current_quantity - item.quantity;
      await inventory.update({
        current_quantity: new_quantity
      });
      
      // 记录库存流水
      await InventoryLog.create({
        product_id: item.product_id,
        type: '出库',
        quantity: item.quantity,
        price: item.price,
        related_bill_no: sale.id,
        balance: new_quantity
      } as any);
    }
    
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: '创建销售单失败' });
  }
});

// 更新销售单
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: '销售单不存在' });
    }
    
    // 这里需要先处理库存回滚，然后重新计算库存
    // 简化版：只更新基本信息，不处理库存变动
    await sale.update(req.body);
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: '更新销售单失败' });
  }
});

// 删除销售单
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: '销售单不存在' });
    }
    
    // 这里需要处理库存回滚
    // 简化版：直接删除
    await SaleItem.destroy({ where: { sale_id: req.params.id } });
    await sale.destroy();
    res.json({ message: '销售单删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除销售单失败' });
  }
});

export default router;