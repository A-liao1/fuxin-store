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
const { ExpressBill, ExpressBillItem, Supplier, Product, Purchase, PurchaseItem, Inventory, InventoryLog } = models_1.default;
// 获取所有快递单
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { expressCode, supplierName, status } = req.query;
        // 构建查询条件
        const whereClause = {};
        const includeOptions = [
            { model: ExpressBillItem, as: 'ExpressBillItems', include: [{ model: Product, as: 'Product' }] }
        ];
        // 如果有快递单号搜索参数
        if (expressCode && typeof expressCode === 'string') {
            whereClause.express_code = {
                [sequelize_1.Op.like]: `%${expressCode}%`
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
        // 包含采购单信息
        includeOptions.push({
            model: Purchase,
            as: 'Purchase'
        });
        const expressBills = yield ExpressBill.findAll({
            where: whereClause,
            include: includeOptions,
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });
        res.json(expressBills);
    }
    catch (error) {
        console.error('获取快递单列表失败:', error);
        res.status(500).json({ error: '获取快递单列表失败' });
    }
}));
// 获取单个快递单
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('获取快递单详情:', req.params.id);
        const expressBill = yield ExpressBill.findByPk(req.params.id, {
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
    }
    catch (error) {
        console.error('获取快递单详情失败:', error);
        res.status(500).json({ error: '获取快递单详情失败' });
    }
}));
// 创建快递单
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { express_code, supplier_id, items, operator, remark } = req.body;
        // 检查快递单号是否已存在
        const existingBill = yield ExpressBill.findOne({ where: { express_code } });
        if (existingBill) {
            return res.status(400).json({ error: '快递单号已存在' });
        }
        // 计算总金额
        const total_amount = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        // 创建快递单
        const expressBill = yield ExpressBill.create({
            express_code,
            supplier_id: supplier_id || null,
            status: '待处理',
            operator,
            remark
        });
        // 处理快递单明细
        for (const item of items) {
            // 获取商品信息以获取规格
            const product = yield Product.findByPk(item.product_id);
            const spec = (product === null || product === void 0 ? void 0 : product.spec) || 1;
            // 计算小计（包含规格）
            const subtotal = (item.price || 0) * item.quantity * spec;
            yield ExpressBillItem.create({
                express_bill_id: expressBill.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price || 0,
                subtotal: subtotal
            });
        }
        res.status(201).json(expressBill);
    }
    catch (error) {
        console.error('创建快递单失败:', error);
        res.status(500).json({ error: '创建快递单失败' });
    }
}));
// 更新快递单
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expressBill = yield ExpressBill.findByPk(req.params.id);
        if (!expressBill) {
            return res.status(404).json({ error: '快递单不存在' });
        }
        const { supplier_id, remark } = req.body;
        // 更新快递单基本信息
        yield expressBill.update({
            supplier_id: supplier_id || null,
            remark
        });
        // 如果有商品明细更新
        if (req.body.items) {
            // 删除现有明细
            yield ExpressBillItem.destroy({ where: { express_bill_id: req.params.id } });
            // 添加新明细
            for (const item of req.body.items) {
                // 获取商品信息以获取规格
                const product = yield Product.findByPk(item.product_id);
                const spec = (product === null || product === void 0 ? void 0 : product.spec) || 1;
                // 计算小计（包含规格）
                const subtotal = (item.price || 0) * item.quantity * spec;
                yield ExpressBillItem.create({
                    express_bill_id: expressBill.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price || 0,
                    subtotal: subtotal
                });
            }
        }
        res.json(expressBill);
    }
    catch (error) {
        res.status(500).json({ error: '更新快递单失败' });
    }
}));
// 删除快递单
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expressBill = yield ExpressBill.findByPk(req.params.id);
        if (!expressBill) {
            return res.status(404).json({ error: '快递单不存在' });
        }
        // 删除快递单明细
        yield ExpressBillItem.destroy({ where: { express_bill_id: req.params.id } });
        // 删除快递单
        yield expressBill.destroy();
        res.json({ message: '快递单删除成功' });
    }
    catch (error) {
        res.status(500).json({ error: '删除快递单失败' });
    }
}));
// 将快递单转换为入库单
router.post('/:id/convert-to-purchase', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const expressBill = yield ExpressBill.findByPk(req.params.id, {
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
            const price = (purchase_price === null || purchase_price === void 0 ? void 0 : purchase_price[item.product_id]) || item.price || 0;
            // 验证价格是否大于0
            if (price <= 0) {
                return res.status(400).json({ error: `商品 ${(_a = item.Product) === null || _a === void 0 ? void 0 : _a.name} 的采购价格必须大于0` });
            }
            // 验证数量是否大于0
            if (item.quantity <= 0) {
                return res.status(400).json({ error: `商品 ${(_b = item.Product) === null || _b === void 0 ? void 0 : _b.name} 的数量必须大于0` });
            }
        }
        // 计算总金额
        const items = ((_c = expressBill.ExpressBillItems) === null || _c === void 0 ? void 0 : _c.map((item) => {
            var _a;
            const price = (purchase_price === null || purchase_price === void 0 ? void 0 : purchase_price[item.product_id]) || item.price || 0;
            const spec = ((_a = item.Product) === null || _a === void 0 ? void 0 : _a.spec) || 1;
            const subtotal = price * item.quantity * spec;
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                price,
                subtotal
            };
        })) || [];
        const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
        // 创建入库单
        const purchase = yield Purchase.create({
            supplier_id,
            date: new Date(),
            total_amount,
            settlement_status: '未结',
            operator,
            remark: `由快递单 ${expressBill.express_code} 转换`,
            express_bill_code: expressBill.express_code
        });
        // 处理入库明细和库存更新
        for (const item of items) {
            // 创建入库明细
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
            else {
                // 如果库存不存在，创建新库存记录
                yield Inventory.create({
                    product_id: item.product_id,
                    current_quantity: item.quantity,
                    avg_cost: item.price
                });
                // 记录库存流水
                yield InventoryLog.create({
                    product_id: item.product_id,
                    type: '入库',
                    quantity: item.quantity,
                    price: item.price,
                    related_bill_no: purchase.id,
                    balance: item.quantity
                });
            }
        }
        // 更新快递单状态、关联的入库单ID、供应商ID，并更新商品价格
        yield expressBill.update({
            status: '已入库',
            purchase_id: purchase.id,
            supplier_id: supplier_id
        });
        // 更新快递单中商品的价格
        console.log('开始更新快递单商品价格');
        console.log('purchase_price:', purchase_price);
        for (const item of expressBill.ExpressBillItems || []) {
            console.log('更新商品:', (_d = item.Product) === null || _d === void 0 ? void 0 : _d.name);
            console.log('当前价格:', item.price);
            console.log('商品ID:', item.product_id);
            const price = (purchase_price === null || purchase_price === void 0 ? void 0 : purchase_price[item.product_id]) || item.price || 0;
            const spec = ((_e = item.Product) === null || _e === void 0 ? void 0 : _e.spec) || 1;
            console.log('计算后价格:', price);
            console.log('商品规格:', spec);
            yield item.update({
                price: price,
                subtotal: price * item.quantity * spec
            });
            // 验证更新结果
            const updatedItem = yield ExpressBillItem.findByPk(item.id);
            console.log('更新后价格:', updatedItem === null || updatedItem === void 0 ? void 0 : updatedItem.price);
            console.log('更新后小计:', updatedItem === null || updatedItem === void 0 ? void 0 : updatedItem.subtotal);
        }
        // 重新获取最新的快递单数据，包含更新后的商品价格
        const updatedExpressBill = yield ExpressBill.findByPk(expressBill.id, {
            include: [
                { model: ExpressBillItem, as: 'ExpressBillItems', include: [{ model: Product, as: 'Product' }] },
                { model: Supplier, as: 'Supplier' },
                { model: Purchase, as: 'Purchase' }
            ]
        });
        res.status(201).json({ purchase, expressBill: updatedExpressBill });
    }
    catch (error) {
        console.error('转换为入库单失败:', error);
        res.status(500).json({ error: '转换为入库单失败' });
    }
}));
exports.default = router;
