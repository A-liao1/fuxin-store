import express from 'express';
import models from '../models';

const router = express.Router();
const { Brand } = models;

// 获取所有品牌
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.json(brands);
  } catch (error) {
    console.error('获取品牌列表失败:', error);
    res.status(500).json({ error: '获取品牌列表失败' });
  }
});

// 创建品牌
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '品牌名称不能为空' });
    }
    
    // 检查品牌是否已存在
    const existingBrand = await Brand.findOne({ where: { name: name.trim() } });
    if (existingBrand) {
      return res.status(400).json({ error: '品牌已存在' });
    }
    
    const brand = await Brand.create({ name: name.trim() } as any);
    res.status(201).json(brand);
  } catch (error) {
    console.error('创建品牌失败:', error);
    res.status(500).json({ error: '创建品牌失败' });
  }
});

// 删除品牌
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({ error: '品牌不存在' });
    }
    
    // 检查是否有商品关联此品牌
    const productsCount = await models.Product.count({ where: { brand_id: id } });
    if (productsCount > 0) {
      return res.status(400).json({ error: '该品牌下还有商品，无法删除' });
    }
    
    await brand.destroy();
    res.json({ message: '品牌删除成功' });
  } catch (error) {
    console.error('删除品牌失败:', error);
    res.status(500).json({ error: '删除品牌失败' });
  }
});

export default router;