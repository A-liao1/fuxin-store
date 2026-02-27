import express from 'express';
import models from '../models';

const router = express.Router();
const { Supplier } = models;

// 获取所有供应商
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: '获取供应商列表失败' });
  }
});

// 获取单个供应商
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: '获取供应商详情失败' });
  }
});

// 创建供应商
router.post('/', async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: '创建供应商失败' });
  }
});

// 更新供应商
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }
    
    await supplier.update(req.body);
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: '更新供应商失败' });
  }
});

// 删除供应商
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: '供应商不存在' });
    }
    
    await supplier.destroy();
    res.json({ message: '供应商删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除供应商失败' });
  }
});

export default router;