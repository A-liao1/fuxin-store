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
const express_1 = __importDefault(require("express"));
const models_1 = __importDefault(require("../models"));
const router = express_1.default.Router();
const { Sale, SaleItem, Purchase, PurchaseItem, Inventory, Product } = models_1.default;
// 获取仪表盘数据
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 获取今天的日期（用于查询）
        const today = new Date().toISOString().split('T')[0];
        console.log('今日日期:', today);
        // 1. 获取今日销售
        console.log('开始查询今日销售记录...');
        console.log('今日日期:', today);
        // 直接获取所有销售记录，然后在代码中过滤
        const allSales = yield Sale.findAll({
            include: [{ model: SaleItem, as: 'SaleItems' }]
        });
        console.log('所有销售记录:', allSales);
        // 在代码中过滤今日销售记录
        const todaySales = allSales.filter(sale => {
            const saleDate = sale.date;
            const saleDateStr = typeof saleDate === 'string' ? saleDate : saleDate.toISOString();
            return saleDateStr.startsWith(today);
        });
        console.log('今日销售记录:', todaySales);
        let todaySalesAmount = 0;
        let todayCost = 0;
        for (const sale of todaySales) {
            todaySalesAmount += sale.total_amount;
            for (const item of sale.SaleItems) {
                todayCost += item.quantity * item.cost_price;
            }
        }
        console.log('今日销售额:', todaySalesAmount);
        const todayProfit = todaySalesAmount - todayCost;
        // 2. 获取今日入库
        console.log('开始查询今日入库记录...');
        console.log('今日日期:', today);
        // 直接获取所有采购记录，然后在代码中过滤
        const allPurchases = yield Purchase.findAll();
        console.log('所有采购记录:', allPurchases);
        // 在代码中过滤今日入库记录
        const todayPurchases = allPurchases.filter(purchase => {
            const purchaseDate = purchase.date;
            const purchaseDateStr = typeof purchaseDate === 'string' ? purchaseDate : purchaseDate.toISOString();
            return purchaseDateStr.startsWith(today);
        });
        console.log('今日入库记录:', todayPurchases);
        let todayInbound = 0;
        for (const purchase of todayPurchases) {
            todayInbound += purchase.total_amount;
        }
        console.log('今日入库金额:', todayInbound);
        // 2. 获取库存总价值
        const inventoryItems = yield Inventory.findAll({
            include: [{ model: Product, as: 'Product' }]
        });
        console.log('库存项目:', inventoryItems);
        let totalInventoryValue = 0;
        // 手动计算每个商品的价值，与库存管理页面保持一致
        // 计算逻辑：current_quantity * avg_cost * spec
        for (const item of inventoryItems) {
            // 使用Number()确保类型正确，避免精度问题
            const currentQuantity = Number(item.current_quantity);
            const avgCost = Number(item.avg_cost);
            const spec = Number(((_a = item.Product) === null || _a === void 0 ? void 0 : _a.spec) || 1);
            const itemValue = currentQuantity * avgCost * spec;
            console.log(`商品 ${((_b = item.Product) === null || _b === void 0 ? void 0 : _b.name) || item.product_id} 价值: ${itemValue}`);
            totalInventoryValue += itemValue;
        }
        console.log('库存总价值:', totalInventoryValue);
        // 3. 获取未收账款
        const pendingSales = yield Sale.findAll({
            where: {
                settlement_status: '未结'
            }
        });
        let pendingReceivables = 0;
        for (const sale of pendingSales) {
            pendingReceivables += sale.total_amount;
        }
        // 4. 获取未付货款
        const pendingPurchases = yield Purchase.findAll({
            where: {
                settlement_status: '未结'
            }
        });
        let pendingPayables = 0;
        for (const purchase of pendingPurchases) {
            pendingPayables += purchase.total_amount;
        }
        res.json({
            todaySales: todaySalesAmount,
            todayInbound,
            totalInventoryValue,
            pendingReceivables,
            pendingPayables
        });
    }
    catch (error) {
        console.error('获取仪表盘数据失败:', error);
        res.status(500).json({ error: '获取仪表盘数据失败' });
    }
}));
exports.default = router;
