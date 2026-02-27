import express from 'express';
import models from '../models';

const router = express.Router();
const { Inventory, Product, InventoryLog } = models;

// 获取实时库存
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      include: [{ model: Product, as: 'Product' }]
    });
    res.json(inventory);
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