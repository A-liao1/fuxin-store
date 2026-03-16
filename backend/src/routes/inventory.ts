import express from 'express';
import models from '../models';
import { Op } from 'sequelize';

const router = express.Router();
const { Inventory, Product, InventoryLog } = models;

// 获取实时库存
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      where: {
        current_quantity: {
          [Op.gt]: 0
        }
      },
      include: [{ model: Product, as: 'Product' }]
    });
    // 转换数据格式，使用前端期望的字段名
    const formattedInventory = inventory.map(item => ({
      product_id: item.product_id,
      current_quantity: item.current_quantity,
      quantity: item.current_quantity, // 兼容移动端
      avg_cost: item.avg_cost,
      Product: (item as any).Product
    }));
    res.json(formattedInventory);
  } catch (error) {
    res.status(500).json({ error: '获取库存列表失败' });
  }
});

// 获取库存流水
router.get('/logs/:product_id', async (req, res) => {
  try {
    const logs = await InventoryLog.findAll({
      where: { product_id: req.params.product_id },
      include: [{ model: Product, as: 'Product' }],
      order: [['create_time', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取库存流水失败' });
  }
});

// 获取所有库存流水
router.get('/logs', async (req, res) => {
  try {
    const logs = await InventoryLog.findAll({
      include: [{ model: Product, as: 'Product' }],
      order: [['create_time', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取库存流水失败' });
  }
});

// 获取单个商品库存
router.get('/:product_id', async (req, res) => {
  try {
    const inventory = await Inventory.findOne({
      where: { product_id: req.params.product_id },
      include: [{ model: Product, as: 'Product' }]
    });
    if (!inventory) {
      return res.status(404).json({ error: '库存记录不存在' });
    }
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: '获取库存详情失败' });
  }
});

export default router;