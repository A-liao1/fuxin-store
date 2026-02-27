import express from 'express';
import { Op } from 'sequelize';
import models from '../models';

const router = express.Router();
const { ExpressBill, ExpressBillItem, Supplier, Product, Purchase, PurchaseItem, Inventory, InventoryLog } = models;

// 获取所有快递单
router.get('/', async (req, res) => {
  try {
    const { expressCode, supplierName, status } = req.query;
    
    // 构建查询条件
    const whereClause: any = {};
    const includeOptions: any[] = [
      { model: ExpressBillItem, as: 'ExpressBillItems', include: [{ model: Product, as: 'Product' }] }
    ];
    
    // 如果有快递单号搜索参数
    if (expressCode && typeof expressCode === 'string') {
      whereClause.express_code = {
        [Op.like]: `%${expressCode}%`
      };
    }
    
    // 如果有状态搜索参数
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }
    
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
        required: true // INNER JOIN，只返回匹配的记录
      });
    } else {
      includeOptions.push({
        model: Supplier,
        as: 'Supplier'
      });
    }
    
    // 包含采购单信息
    includeOptions.push({
      model: Purchase,
      as: 'Purchase'
    });
    
    const expressBills = await ExpressBill.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
    
    res.json(expressBills);
  } catch (error) {
    console.error('获取快递单列表失败:', error);
    res.status(500).json({ error: '获取快递单列表失败' });
  }
});

// 获取单个快递单
router.get('/:id', async (req, res) => {
  try {
    console.log('获取快递单详情:', req.params.id);
    
    const expressBill = await ExpressBill.findByPk(req.params.id, {
      include: [
        { 
          model: ExpressBillItem, 
          as: 'ExpressBillItems', 
          include: [{ model: Product, as: 'Product' }],
          // 确保返回所有字段，包括price和subtotal
          attributes: ['id', 'express_bill_id', 'product_id', 'quantity', 'price', 'subtotal', 'createdAt', 'updatedAt']
        },
        { model: Supplier, as: 'Supplier' },
        { model: Purchase, as: 'Purchase' }
      ]
    });
    
    console.log('快递单详情:', expressBill);
    
    if (!expressBill) {
      return res.status(404).json({ error: '快递单不存在' });
    }
    res.json(expressBill);
  } catch (error) {
    console.error('获取快递单详情失败:', error);
    res.status(500).json({ error: '获取快递单详情失败' });
  }
});

// 创建快递单
router.post('/', async (req, res) => {
  try {
    const { express_code, supplier_id, items, operator, remark } = req.body;
    
    // 检查快递单号是否已存在
    const existingBill = await ExpressBill.findOne({ where: { express_code } });
    if (existingBill) {
      return res.status(400).json({ error: '快递单号已存在' });
    }
    
    // 计算总金额
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    
    // 创建快递单
    const expressBill = await ExpressBill.create({
      express_code,
      supplier_id: supplier_id || null,
      status: '待处理',
      operator,
      remark
    } as any);
    
    // 处理快递单明细
    for (const item of items) {
      // 获取商品信息以获取规格
      const product = await Product.findByPk(item.product_id);
      const spec = product?.spec || 1;
      
      // 计算小计（包含规格）
      const subtotal = (item.price || 0) * item.quantity * spec;
      
      await ExpressBillItem.create({
        express_bill_id: expressBill.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price || 0,
        subtotal: subtotal
      } as any);
    }
    
    res.status(201).json(expressBill);
  } catch (error) {
    console.error('创建快递单失败:', error);
    res.status(500).json({ error: '创建快递单失败' });
  }
});

// 更新快递单
router.put('/:id', async (req, res) => {
  try {
    const expressBill = await ExpressBill.findByPk(req.params.id);
    if (!expressBill) {
      return res.status(404).json({ error: '快递单不存在' });
    }
    
    const { supplier_id, remark } = req.body;
    
    // 更新快递单基本信息
    await expressBill.update({
      supplier_id: supplier_id || null,
      remark
    } as any);
    
    // 如果有商品明细更新
    if (req.body.items) {
      // 删除现有明细
      await ExpressBillItem.destroy({ where: { express_bill_id: req.params.id } });
      
      // 添加新明细
      for (const item of req.body.items) {
        // 获取商品信息以获取规格
        const product = await Product.findByPk(item.product_id);
        const spec = product?.spec || 1;
        
        // 计算小计（包含规格）
        const subtotal = (item.price || 0) * item.quantity * spec;
        
        await ExpressBillItem.create({
          express_bill_id: expressBill.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price || 0,
          subtotal: subtotal
        } as any);
      }
    }
    
    res.json(expressBill);
  } catch (error) {
    res.status(500).json({ error: '更新快递单失败' });
  }
});

// 删除快递单
router.delete('/:id', async (req, res) => {
  try {
    const expressBill = await ExpressBill.findByPk(req.params.id);
    if (!expressBill) {
      return res.status(404).json({ error: '快递单不存在' });
    }
    
    // 删除快递单明细
    await ExpressBillItem.destroy({ where: { express_bill_id: req.params.id } });
    
    // 删除快递单
    await expressBill.destroy();
    
    res.json({ message: '快递单删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除快递单失败' });
  }
});

// 将快递单转换为入库单
router.post('/:id/convert-to-purchase', async (req, res) => {
  try {
    const expressBill = await ExpressBill.findByPk(req.params.id, {
      include: [{ model: ExpressBillItem, as: 'ExpressBillItems', include: [{ model: Product, as: 'Product' }] }]
    });
    
    if (!expressBill) {
      return res.status(404).json({ error: '快递单不存在' });
    }
    
    if (expressBill.purchase_id) {
      return res.status(400).json({ error: '该快递单已转换为入库单' });
    }
    
    const { supplier_id, purchase_price, operator } = req.body;
    
    if (!supplier_id) {
      return res.status(400).json({ error: '请选择供应商' });
    }
    
    // 验证价格和数量
    for (const item of expressBill.ExpressBillItems || []) {
      const price = purchase_price?.[item.product_id] || item.price || 0;
      
      // 验证价格是否大于0
      if (price <= 0) {
        return res.status(400).json({ error: `商品 ${item.Product?.name} 的采购价格必须大于0` });
      }
      // 验证数量是否大于0
      if (item.quantity <= 0) {
        return res.status(400).json({ error: `商品 ${item.Product?.name} 的数量必须大于0` });
      }
    }
    
    // 计算总金额
    const items = expressBill.ExpressBillItems?.map((item: any) => {
      const price = purchase_price?.[item.product_id] || item.price || 0;
      const spec = item.Product?.spec || 1;
      const subtotal = price * item.quantity * spec;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price,
        subtotal
      };
    }) || [];
    
    const total_amount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    
    // 创建入库单
    const purchase = await Purchase.create({
      supplier_id,
      date: new Date(),
      total_amount,
      settlement_status: '未结',
      operator,
      remark: `由快递单 ${expressBill.express_code} 转换`,
      express_bill_code: expressBill.express_code
    } as any);
    
    // 处理入库明细和库存更新
    for (const item of items) {
      // 创建入库明细
      await PurchaseItem.create({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      } as any);
      
      // 更新库存（移动加权平均法）
      const inventory = await Inventory.findOne({ where: { product_id: item.product_id } });
      if (inventory) {
        const new_quantity = inventory.current_quantity + item.quantity;
        const new_avg_cost = ((inventory.current_quantity * inventory.avg_cost) + (item.quantity * item.price)) / new_quantity;
        
        await inventory.update({
          current_quantity: new_quantity,
          avg_cost: new_avg_cost
        });
        
        // 记录库存流水
        await InventoryLog.create({
          product_id: item.product_id,
          type: '入库',
          quantity: item.quantity,
          price: item.price,
          related_bill_no: purchase.id,
          balance: new_quantity
        } as any);
      } else {
        // 如果库存不存在，创建新库存记录
        await Inventory.create({
          product_id: item.product_id,
          current_quantity: item.quantity,
          avg_cost: item.price
        } as any);
        
        // 记录库存流水
        await InventoryLog.create({
          product_id: item.product_id,
          type: '入库',
          quantity: item.quantity,
          price: item.price,
          related_bill_no: purchase.id,
          balance: item.quantity
        } as any);
      }
    }
    
    // 更新快递单状态、关联的入库单ID、供应商ID，并更新商品价格
    await expressBill.update({
      status: '已入库',
      purchase_id: purchase.id,
      supplier_id: supplier_id
    } as any);
    
    // 更新快递单中商品的价格
    console.log('开始更新快递单商品价格');
    console.log('purchase_price:', purchase_price);
    
    for (const item of expressBill.ExpressBillItems || []) {
      console.log('更新商品:', item.Product?.name);
      console.log('当前价格:', item.price);
      console.log('商品ID:', item.product_id);
      
      const price = purchase_price?.[item.product_id] || item.price || 0;
      const spec = item.Product?.spec || 1;
      console.log('计算后价格:', price);
      console.log('商品规格:', spec);
      
      await item.update({
        price: price,
        subtotal: price * item.quantity * spec
      } as any);
      
      // 验证更新结果
      const updatedItem = await ExpressBillItem.findByPk(item.id);
      console.log('更新后价格:', updatedItem?.price);
      console.log('更新后小计:', updatedItem?.subtotal);
    }
    
    // 重新获取最新的快递单数据，包含更新后的商品价格
    const updatedExpressBill = await ExpressBill.findByPk(expressBill.id, {
      include: [
        { model: ExpressBillItem, as: 'ExpressBillItems', include: [{ model: Product, as: 'Product' }] },
        { model: Supplier, as: 'Supplier' },
        { model: Purchase, as: 'Purchase' }
      ]
    });
    
    res.status(201).json({ purchase, expressBill: updatedExpressBill });
  } catch (error) {
    console.error('转换为入库单失败:', error);
    res.status(500).json({ error: '转换为入库单失败' });
  }
});

export default router;