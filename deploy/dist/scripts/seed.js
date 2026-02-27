"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const models_2 = __importDefault(require("../models"));
const { Product, Supplier, Customer, Purchase, Sale, SaleItem, PurchaseItem, Inventory, InventoryLog, Settlement, Brand } = models_2.default;
// 类型断言工具函数
const create = (model, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield model.create(data);
});
const bulkCreate = (model, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield model.bulkCreate(data);
});
// 清除所有数据
const clearData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('开始清除数据...');
        // 按依赖关系顺序删除数据
        yield Settlement.destroy({ truncate: true, cascade: true });
        yield SaleItem.destroy({ truncate: true, cascade: true });
        yield Sale.destroy({ truncate: true, cascade: true });
        yield PurchaseItem.destroy({ truncate: true, cascade: true });
        yield Purchase.destroy({ truncate: true, cascade: true });
        yield InventoryLog.destroy({ truncate: true, cascade: true });
        yield Inventory.destroy({ truncate: true, cascade: true });
        yield Product.destroy({ truncate: true, cascade: true });
        yield Supplier.destroy({ truncate: true, cascade: true });
        yield Customer.destroy({ truncate: true, cascade: true });
        yield Brand.destroy({ truncate: true, cascade: true });
        console.log('数据清除完成');
    }
    catch (error) {
        console.error('清除数据失败:', error);
        throw error;
    }
});
// 生成测试数据
const generateTestData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('开始生成测试数据...');
        // 1. 创建品牌
        const brands = yield bulkCreate(Brand, [
            { name: '五粮液' },
            { name: '茅台' },
            { name: '泸州老窖' }
        ]);
        // 2. 创建供应商
        const suppliers = yield bulkCreate(Supplier, [
            { name: '五粮液供应商', phone: '13800138001' },
            { name: '茅台供应商', phone: '13800138002' },
            { name: '泸州老窖供应商', phone: '13800138003' }
        ]);
        // 3. 创建客户
        const customers = yield bulkCreate(Customer, [
            { name: '张三', phone: '13900139001' },
            { name: '李四', phone: '13900139002' },
            { name: '王五', phone: '13900139003' }
        ]);
        // 4. 创建商品
        const products = yield bulkCreate(Product, [
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
        const inventories = yield bulkCreate(Inventory, [
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
        const purchase = yield create(Purchase, {
            supplier_id: suppliers[0].id,
            date: today,
            total_amount: 7240,
            settlement_status: '已结',
            operator: '管理员',
            remark: ''
        });
        // 创建采购明细
        yield create(PurchaseItem, {
            purchase_id: purchase.id,
            product_id: products[0].id,
            quantity: 10,
            price: 724,
            subtotal: 7240
        });
        // 7. 创建销售单
        const sale = yield create(Sale, {
            customer_id: customers[0].id,
            date: today,
            total_amount: 8200,
            settlement_status: '未结',
            operator: '管理员',
            remark: ''
        });
        // 创建销售明细
        yield create(SaleItem, {
            sale_id: sale.id,
            product_id: products[0].id,
            quantity: 10,
            price: 820,
            subtotal: 8200,
            cost_price: 724
        });
        // 8. 创建库存流水
        yield create(InventoryLog, {
            product_id: products[0].id,
            type: '入库',
            quantity: 10,
            price: 724,
            related_bill_no: purchase.id,
            balance: 15,
            create_time: new Date()
        });
        yield create(InventoryLog, {
            product_id: products[0].id,
            type: '出库',
            quantity: 10,
            price: 724,
            related_bill_no: sale.id,
            balance: 5,
            create_time: new Date()
        });
        console.log('测试数据生成完成！');
    }
    catch (error) {
        console.error('生成测试数据失败:', error);
        throw error;
    }
});
// 主函数
const seed = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('开始重置数据库...');
        // 强制同步模型结构
        yield models_1.sequelize.sync({ force: true });
        console.log('数据库结构同步完成');
        // 生成测试数据
        yield generateTestData();
        console.log('\n===== 测试数据生成成功 =====');
        console.log('数据库已重置并填充测试数据');
        process.exit(0);
    }
    catch (error) {
        console.error('重置数据库失败:', error);
        process.exit(1);
    }
});
// 运行脚本
seed();
