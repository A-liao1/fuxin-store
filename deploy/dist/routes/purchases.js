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
const { Purchase, PurchaseItem, Product, Inventory, InventoryLog, Supplier } = models_1.default;
// 获取所有采购单
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { supplierName, expressBillCode, totalAmount, settlementStatus } = req.query;
        // 构建查询条件
        const whereClause = {};
        const includeOptions = [
            { model: PurchaseItem, as: 'PurchaseItems', include: [{ model: Product, as: 'Product' }] }
        ];
        // 如果有供应商名称搜索参数
        if (supplierName && typeof supplierName === 'string') {
            includeOptions.push({
                model: Supplier,
                as: 'Supplier',
                where: {
                    name: {
                        [sequelize_1.Op.like]: `%${supplierName}%`
                    }
                },
                required: true // INNER JOIN，只返回匹配的记录
            });
        }
        else {
            includeOptions.push({
                model: Supplier,
                as: 'Supplier'
            });
        }
        // 如果有快递单号搜索参数
        if (expressBillCode && typeof expressBillCode === 'string') {
            whereClause.express_bill_code = {
                [sequelize_1.Op.like]: `%${expressBillCode}%`
            };
        }
        // 如果有总金额搜索参数
        if (totalAmount && !isNaN(Number(totalAmount))) {
            whereClause.total_amount = Number(totalAmount);
        }
        // 如果有结算状态搜索参数
        if (settlementStatus && typeof settlementStatus === 'string') {
            whereClause.settlement_status = settlementStatus;
        }
        const purchases = yield Purchase.findAll({
            where: whereClause,
            include: includeOptions,
            order: [['date', 'DESC'], ['id', 'DESC']]
        });
        res.json(purchases);
    }
    catch (error) {
        console.error('获取采购单列表失败:', error);
        res.status(500).json({ error: '获取采购单列表失败' });
    }
}));
// 获取单个采购单
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purchase = yield Purchase.findByPk(req.params.id, {
            include: [
                { model: PurchaseItem, as: 'PurchaseItems', include: [{ model: Product, as: 'Product' }] },
                { model: models_1.default.Supplier, as: 'Supplier' }
            ]
        });
        if (!purchase) {
            return res.status(404).json({ error: '采购单不存在' });
        }
        res.json(purchase);
    }
    catch (error) {
        res.status(500).json({ error: '获取采购单详情失败' });
    }
}));
// 创建采购单
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { supplier_id, date, items, operator, remark } = req.body;
        // 计算总金额
        const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
        // 创建采购单
        const purchase = yield Purchase.create({
            supplier_id,
            date,
            total_amount,
            settlement_status: '未结',
            operator,
            remark
        });
        // 处理采购明细和库存更新
        for (const item of items) {
            // 创建采购明细
            yield PurchaseItem.create({
                purchase_id: purchase.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            });
            // 更新库存（移动加权平均法）
            const inventory = yield Inventory.findOne({ where: { product_id: item.product_id } });
            if (inventory) {
                const new_quantity = inventory.current_quantity + item.quantity;
                const new_avg_cost = ((inventory.current_quantity * inventory.avg_cost) + (item.quantity * item.price)) / new_quantity;
                yield inventory.update({
                    current_quantity: new_quantity,
                    avg_cost: new_avg_cost
                });
                // 记录库存流水
                yield InventoryLog.create({
                    product_id: item.product_id,
                    type: '入库',
                    quantity: item.quantity,
                    price: item.price,
                    related_bill_no: purchase.id,
                    balance: new_quantity
                });
            }
        }
        res.status(201).json(purchase);
    }
    catch (error) {
        res.status(500).json({ error: '创建采购单失败' });
    }
}));
// 更新采购单
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purchase = yield Purchase.findByPk(req.params.id);
        if (!purchase) {
            return res.status(404).json({ error: '采购单不存在' });
        }
        // 这里需要先处理库存回滚，然后重新计算库存
        // 简化版：只更新基本信息，不处理库存变动
        yield purchase.update(req.body);
        res.json(purchase);
    }
    catch (error) {
        res.status(500).json({ error: '更新采购单失败' });
    }
}));
// 删除采购单
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purchase = yield Purchase.findByPk(req.params.id);
        if (!purchase) {
            return res.status(404).json({ error: '采购单不存在' });
        }
        // 这里需要处理库存回滚
        // 简化版：直接删除
        yield PurchaseItem.destroy({ where: { purchase_id: req.params.id } });
        yield purchase.destroy();
        res.json({ message: '采购单删除成功' });
    }
    catch (error) {
        res.status(500).json({ error: '删除采购单失败' });
    }
}));
exports.default = router;
