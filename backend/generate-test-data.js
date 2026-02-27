const models = require('./dist/models').default;
const { Brand, Product, Supplier, Customer, Purchase, Sale, Settlement, PurchaseItem, SaleItem, Inventory, InventoryLog } = models;
const { v4: uuidv4 } = require('uuid');

// 生成测试数据
async function generateTestData() {
  try {
    console.log('开始生成测试数据...');
    
    // 1. 生成品牌数据
    console.log('生成品牌数据...');
    const brands = [
      { name: '五粮液' },
      { name: '茅台' },
      { name: '剑南春' },
      { name: '泸州老窖' },
      { name: '洋河' }
    ];
    
    const createdBrands = [];
    for (const brandData of brands) {
      const brand = await Brand.create(brandData);
      createdBrands.push(brand);
    }
    console.log(`生成了 ${createdBrands.length} 个品牌`);
    
    // 2. 生成供应商数据
    console.log('生成供应商数据...');
    const suppliers = [
      { name: '成都酒业有限公司', phone: '13800138001' },
      { name: '上海酒类批发公司', phone: '13900139001' },
      { name: '广州酒水供应商', phone: '13700137001' }
    ];
    
    const createdSuppliers = [];
    for (const supplierData of suppliers) {
      const supplier = await Supplier.create(supplierData);
      createdSuppliers.push(supplier);
    }
    console.log(`生成了 ${createdSuppliers.length} 个供应商`);
    
    // 3. 生成客户数据
    console.log('生成客户数据...');
    const customers = [
      { name: '北京饭店', type: '企业', phone: '13600136001' },
      { name: '上海大酒店', type: '企业', phone: '13500135001' },
      { name: '广州酒家', type: '企业', phone: '13400134001' },
      { name: '张三', type: '个人', phone: '13300133001' },
      { name: '李四', type: '个人', phone: '13200132001' }
    ];
    
    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = await Customer.create(customerData);
      createdCustomers.push(customer);
    }
    console.log(`生成了 ${createdCustomers.length} 个客户`);
    
    // 4. 生成商品数据
    console.log('生成商品数据...');
    const products = [
      { name: '五粮液第八代', brand_id: createdBrands[0].id, spec: 500, unit: '瓶', purchase_price: 1299, sale_price: 1699, min_stock: 10 },
      { name: '茅台飞天', brand_id: createdBrands[1].id, spec: 500, unit: '瓶', purchase_price: 1499, sale_price: 1999, min_stock: 10 },
      { name: '剑南春水晶剑', brand_id: createdBrands[2].id, spec: 500, unit: '瓶', purchase_price: 499, sale_price: 599, min_stock: 20 },
      { name: '泸州老窖特曲', brand_id: createdBrands[3].id, spec: 500, unit: '瓶', purchase_price: 299, sale_price: 399, min_stock: 20 },
      { name: '洋河蓝色经典梦之蓝', brand_id: createdBrands[4].id, spec: 500, unit: '瓶', purchase_price: 899, sale_price: 1099, min_stock: 15 }
    ];
    
    const createdProducts = [];
    for (const productData of products) {
      const product = await Product.create(productData);
      createdProducts.push(product);
      
      // 为每个商品创建库存记录
      await Inventory.create({
        product_id: product.id,
        current_quantity: 0,
        avg_cost: 0
      });
    }
    console.log(`生成了 ${createdProducts.length} 个商品`);
    
    // 5. 生成采购单数据
    console.log('生成采购单数据...');
    const purchaseOrders = [];
    
    for (let i = 0; i < 3; i++) {
      const supplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)];
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - (i + 1));
      
      const purchase = await Purchase.create({
        supplier_id: supplier.id,
        date: purchaseDate,
        total_amount: 0,
        settlement_status: i === 0 ? '未结' : '已结',
        operator: '管理员',
        remark: `采购单 ${i + 1}`
      });
      
      // 生成采购明细
      const purchaseItems = [];
      let totalAmount = 0;
      
      for (let j = 0; j < 2; j++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const price = product.purchase_price;
        const subtotal = price * quantity;
        totalAmount += subtotal;
        
        const item = await PurchaseItem.create({
          purchase_id: purchase.id,
          product_id: product.id,
          quantity,
          price,
          subtotal
        });
        purchaseItems.push(item);
        
        // 更新库存
        const inventory = await Inventory.findOne({ where: { product_id: product.id } });
        if (inventory) {
          const newQuantity = inventory.current_quantity + quantity;
          const newAvgCost = (inventory.avg_cost * inventory.current_quantity + price * quantity) / newQuantity;
          await inventory.update({ current_quantity: newQuantity, avg_cost: newAvgCost });
          
          // 添加库存日志
          await InventoryLog.create({
            product_id: product.id,
            type: '采购入库',
            quantity,
            price,
            related_bill_no: purchase.id,
            balance: newQuantity,
            create_time: purchaseDate
          });
        }
      }
      
      // 更新采购单总金额
      await purchase.update({ total_amount: totalAmount });
      purchaseOrders.push(purchase);
      
      // 生成结算记录（如果状态为已结）
      if (purchase.settlement_status === '已结') {
        await Settlement.create({
          bill_type: 'purchase',
          bill_id: purchase.id,
          settlement_date: new Date(purchase.date),
          amount: totalAmount,
          payment_method: '银行转账',
          remark: `采购结算 ${i + 1}`
        });
      }
    }
    console.log(`生成了 ${purchaseOrders.length} 个采购单`);
    
    // 6. 生成销售单数据
    console.log('生成销售单数据...');
    const salesOrders = [];
    
    for (let i = 0; i < 5; i++) {
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - (i + 1));
      
      const sale = await Sale.create({
        customer_id: customer.id,
        date: saleDate,
        total_amount: 0,
        settlement_status: i < 2 ? '未结' : '已结',
        operator: '管理员',
        remark: `销售单 ${i + 1}`
      });
      
      // 生成销售明细
      const saleItems = [];
      let totalAmount = 0;
      
      for (let j = 0; j < 2; j++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const inventory = await Inventory.findOne({ where: { product_id: product.id } });
        
        if (inventory && inventory.current_quantity > 0) {
          const quantity = Math.min(Math.floor(Math.random() * 5) + 1, inventory.current_quantity);
          const price = product.sale_price;
          const subtotal = price * quantity;
          totalAmount += subtotal;
          
          const item = await SaleItem.create({
            sale_id: sale.id,
            product_id: product.id,
            quantity,
            price,
            subtotal,
            cost_price: inventory.avg_cost
          });
          saleItems.push(item);
          
          // 更新库存
          const newQuantity = inventory.current_quantity - quantity;
          await inventory.update({ current_quantity: newQuantity });
          
          // 添加库存日志
          await InventoryLog.create({
            product_id: product.id,
            type: '销售出库',
            quantity: -quantity,
            price,
            related_bill_no: sale.id,
            balance: newQuantity,
            create_time: saleDate
          });
        }
      }
      
      // 更新销售单总金额
      await sale.update({ total_amount: totalAmount });
      salesOrders.push(sale);
      
      // 生成结算记录（如果状态为已结）
      if (sale.settlement_status === '已结') {
        await Settlement.create({
          bill_type: 'sale',
          bill_id: sale.id,
          settlement_date: new Date(sale.date),
          amount: totalAmount,
          payment_method: Math.random() > 0.5 ? '现金' : '支付宝',
          remark: `销售结算 ${i + 1}`
        });
      }
    }
    console.log(`生成了 ${salesOrders.length} 个销售单`);
    
    console.log('测试数据生成完成！');
    console.log(`- 品牌: ${createdBrands.length} 个`);
    console.log(`- 商品: ${createdProducts.length} 个`);
    console.log(`- 供应商: ${createdSuppliers.length} 个`);
    console.log(`- 客户: ${createdCustomers.length} 个`);
    console.log(`- 采购单: ${purchaseOrders.length} 个`);
    console.log(`- 销售单: ${salesOrders.length} 个`);
    
  } catch (error) {
    console.error('生成测试数据失败:', error);
  } finally {
    // 关闭数据库连接
    process.exit();
  }
}

// 运行生成测试数据函数
generateTestData();
