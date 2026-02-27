import { sequelize } from '../models';
import models from '../models';

const { Product, Supplier, Customer, Purchase, Sale, SaleItem, PurchaseItem, Inventory, InventoryLog, Settlement, Brand } = models;

// 类型断言工具函数
const create = async (model: any, data: any) => {
  return await model.create(data as any);
};

const bulkCreate = async (model: any, data: any[]) => {
  return await model.bulkCreate(data as any[]);
};

// 清除所有数据
const clearData = async () => {
  try {
    console.log('开始清除数据...');
    
    // 按依赖关系顺序删除数据
    await Settlement.destroy({ truncate: true, cascade: true });
    await SaleItem.destroy({ truncate: true, cascade: true });
    await Sale.destroy({ truncate: true, cascade: true });
    await PurchaseItem.destroy({ truncate: true, cascade: true });
    await Purchase.destroy({ truncate: true, cascade: true });
    await InventoryLog.destroy({ truncate: true, cascade: true });
    await Inventory.destroy({ truncate: true, cascade: true });
    await Product.destroy({ truncate: true, cascade: true });
    await Supplier.destroy({ truncate: true, cascade: true });
    await Customer.destroy({ truncate: true, cascade: true });
    await Brand.destroy({ truncate: true, cascade: true });
    
    console.log('数据清除完成');
  } catch (error) {
    console.error('清除数据失败:', error);
    throw error;
  }
};

// 生成测试数据
const generateTestData = async () => {
  try {
    console.log('开始生成测试数据...');
    
    // 1. 创建品牌
    const brands = await bulkCreate(Brand, [
      { name: '五粮液' },
      { name: '茅台' },
      { name: '泸州老窖' }
    ]);
    
    // 2. 创建供应商
    const suppliers = await bulkCreate(Supplier, [
      { name: '五粮液供应商', phone: '13800138001' },
      { name: '茅台供应商', phone: '13800138002' },
      { name: '泸州老窖供应商', phone: '13800138003' }
    ]);
    
    // 3. 创建客户
    const customers = await bulkCreate(Customer, [
      { name: '张三', phone: '13900139001' },
      { name: '李四', phone: '13900139002' },
      { name: '王五', phone: '13900139003' }
    ]);
    
    // 4. 创建商品
    const products = await bulkCreate(Product, [
      {
        name: '八代五粮液',
        brand_id: brands[0].id,
        spec: 1,
        unit: '瓶',
        purchase_price: 724,
        sale_price: 820,
        min_stock: 2
      },
      {
        name: '八代五粮液原件',
        brand_id: brands[0].id,
        spec: 6,
        unit: '箱',
        purchase_price: 743.33,
        sale_price: 820,
        min_stock: 1
      },
      {
        name: '2026飞天茅台原箱',
        brand_id: brands[1].id,
        spec: 6,
        unit: '箱',
        purchase_price: 1600,
        sale_price: 1800,
        min_stock: 1
      },
      {
        name: '泸州老窖特曲',
        brand_id: brands[2].id,
        spec: 1,
        unit: '瓶',
        purchase_price: 120,
        sale_price: 150,
        min_stock: 5
      }
    ]);
    
    // 5. 创建库存
    const inventories = await bulkCreate(Inventory, [
      {
        product_id: products[0].id,
        current_quantity: 5,
        avg_cost: 724
      },
      {
        product_id: products[1].id,
        current_quantity: 3,
        avg_cost: 743.33
      },
      {
        product_id: products[2].id,
        current_quantity: 3,
        avg_cost: 1600
      },
      {
        product_id: products[3].id,
        current_quantity: 10,
        avg_cost: 120
      }
    ]);
    
    // 6. 创建采购单
    const today = new Date().toISOString().split('T')[0];
    const purchase = await create(Purchase, {
      supplier_id: suppliers[0].id,
      date: today,
      total_amount: 7240,
      settlement_status: '已结',
      operator: '管理员',
      remark: ''
    });
    
    // 创建采购明细
    await create(PurchaseItem, {
      purchase_id: purchase.id,
      product_id: products[0].id,
      quantity: 10,
      price: 724,
      subtotal: 7240
    });
    
    // 7. 创建销售单
    const sale = await create(Sale, {
      customer_id: customers[0].id,
      date: today,
      total_amount: 8200,
      settlement_status: '未结',
      operator: '管理员',
      remark: ''
    });
    
    // 创建销售明细
    await create(SaleItem, {
      sale_id: sale.id,
      product_id: products[0].id,
      quantity: 10,
      price: 820,
      subtotal: 8200,
      cost_price: 724
    });
    
    // 8. 创建库存流水
    await create(InventoryLog, {
      product_id: products[0].id,
      type: '入库',
      quantity: 10,
      price: 724,
      related_bill_no: purchase.id,
      balance: 15,
      create_time: new Date()
    });
    
    await create(InventoryLog, {
      product_id: products[0].id,
      type: '出库',
      quantity: 10,
      price: 724,
      related_bill_no: sale.id,
      balance: 5,
      create_time: new Date()
    });
    
    console.log('测试数据生成完成！');
  } catch (error) {
    console.error('生成测试数据失败:', error);
    throw error;
  }
};

// 主函数
const seed = async () => {
  try {
    console.log('开始重置数据库...');
    
    // 强制同步模型结构
    await sequelize.sync({ force: true });
    console.log('数据库结构同步完成');
    
    // 生成测试数据
    await generateTestData();
    
    console.log('\n===== 测试数据生成成功 =====');
    console.log('数据库已重置并填充测试数据');
    
    process.exit(0);
  } catch (error) {
    console.error('重置数据库失败:', error);
    process.exit(1);
  }
};

// 运行脚本
seed();
