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
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const router = express_1.default.Router();
const { Sale, SaleItem, Product, Inventory, InventoryLog, Customer } = models_1.default;
// 获取所有销售单
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerName } = req.query;
        // 构建查询条件
        const whereClause = {};
        const includeOptions = [
            { model: SaleItem, as: 'SaleItems', include: [{ model: Product, as: 'Product' }] }
        ];
        // 如果有客户名称搜索参数
        if (customerName && typeof customerName === 'string') {
            includeOptions.push({
                model: Customer,
                as: 'Customer',
                where: {
                    name: {
                        [sequelize_1.Op.like]: `%${customerName}%`
                    }
                },
                required: true // INNER JOIN，只返回匹配的记录
            });
        }
        else {
            includeOptions.push({
                model: Customer,
                as: 'Customer'
            });
        }
        const sales = yield Sale.findAll({
            where: whereClause,
            include: includeOptions,
            order: [['date', 'DESC'], ['id', 'DESC']]
        });
        res.json(sales);
    }
    catch (error) {
        console.error('获取销售单列表失败:', error);
        res.status(500).json({ error: '获取销售单列表失败' });
    }
}));
// 获取单个销售单
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sale = yield Sale.findByPk(req.params.id, {
            include: [
                { model: SaleItem, as: 'SaleItems', include: [{ model: Product, as: 'Product' }] },
                { model: models_1.default.Customer, as: 'Customer' }
            ]
        });
        if (!sale) {
            return res.status(404).json({ error: '销售单不存在' });
        }
        res.json(sale);
    }
    catch (error) {
        res.status(500).json({ error: '获取销售单详情失败' });
    }
}));
// 创建销售单
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customer_id, date, items, operator, remark } = req.body;
        // 计算总金额
        const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
        // 创建销售单
        const sale = yield Sale.create({
            customer_id,
            date,
            total_amount,
            settlement_status: '未结',
            operator,
            remark
        });
        // 处理销售明细和库存更新
        for (const item of items) {
            // 检查库存
            const inventory = yield Inventory.findOne({ where: { product_id: item.product_id } });
            if (!inventory || inventory.current_quantity < item.quantity) {
                throw new Error('库存不足');
            }
            // 创建销售明细，记录当前成本价
            yield SaleItem.create({
                sale_id: sale.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
                cost_price: inventory.avg_cost
            });
            // 更新库存
            const new_quantity = inventory.current_quantity - item.quantity;
            yield inventory.update({
                current_quantity: new_quantity
            });
            // 记录库存流水
            yield InventoryLog.create({
                product_id: item.product_id,
                type: '出库',
                quantity: item.quantity,
                price: item.price,
                related_bill_no: sale.id,
                balance: new_quantity
            });
        }
        res.status(201).json(sale);
    }
    catch (error) {
        res.status(500).json({ error: '创建销售单失败' });
    }
}));
// 更新销售单
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sale = yield Sale.findByPk(req.params.id);
        if (!sale) {
            return res.status(404).json({ error: '销售单不存在' });
        }
        // 这里需要先处理库存回滚，然后重新计算库存
        // 简化版：只更新基本信息，不处理库存变动
        yield sale.update(req.body);
        res.json(sale);
    }
    catch (error) {
        res.status(500).json({ error: '更新销售单失败' });
    }
}));
// 删除销售单
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sale = yield Sale.findByPk(req.params.id);
        if (!sale) {
            return res.status(404).json({ error: '销售单不存在' });
        }
        // 这里需要处理库存回滚
        // 简化版：直接删除
        yield SaleItem.destroy({ where: { sale_id: req.params.id } });
        yield sale.destroy();
        res.json({ message: '销售单删除成功' });
    }
    catch (error) {
        res.status(500).json({ error: '删除销售单失败' });
    }
}));
exports.default = router;
