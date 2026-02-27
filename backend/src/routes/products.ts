import express from 'express';
import models from '../models';

const router = express.Router();
const { Product, Inventory } = models;

// 获取所有商品
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Inventory, as: 'Inventory' },
        { model: models.Brand, as: 'Brand' }
      ]
    });
    res.json(products);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 获取单个商品
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Inventory, as: 'Inventory' },
        { model: models.Brand, as: 'Brand' }
      ]
    });
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

// 创建商品
router.post('/', async (req, res) => {
  try {
    console.log('接收到创建商品请求:', req.body);
    
    // 设置默认值
    const productData = {
      ...req.body,
      purchase_price: req.body.purchase_price || 0,
      sale_price: req.body.sale_price || 0,
      min_stock: req.body.min_stock || 0
    };
    
    // 确保 spec 字段为数字类型，默认为1
    if (req.body.spec !== undefined && req.body.spec !== null) {
      productData.spec = parseInt(req.body.spec, 10);
    } else {
      productData.spec = 1;
    }
    
    console.log('处理后的商品数据:', productData);
    
    const product = await Product.create(productData);
    console.log('商品创建成功:', product.id);
    
    // 初始化库存
    await Inventory.create({
      product_id: product.id,
      current_quantity: 0,
      avg_cost: product.purchase_price
    });
    console.log('库存初始化成功:', product.id);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('创建商品失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: '创建商品失败', details: errorMessage });
  }
});

// 更新商品
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    
    await product.update(req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: '更新商品失败' });
  }
});

// 删除商品
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    
    // 删除关联的库存记录
    await Inventory.destroy({ where: { product_id: req.params.id } });
    
    await product.destroy();
    res.json({ message: '商品删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除商品失败' });
  }
});

export default router;