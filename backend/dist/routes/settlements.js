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
const { Settlement, Purchase, Sale, Supplier, Customer } = models_1.default;
// 获取所有结算记录
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { supplierName, customerName, billType, paymentMethod, expressBillCode, amount } = req.query;
        console.log('开始获取结算记录，查询参数:', { supplierName, customerName, billType, paymentMethod, expressBillCode, amount });
        const whereClause = {};
        // 单据类型过滤
        if (billType && typeof billType === 'string') {
            whereClause.bill_type = billType;
        }
        // 支付方式过滤
        if (paymentMethod && typeof paymentMethod === 'string') {
            whereClause.payment_method = paymentMethod;
        }
        // 快递单号过滤
        if (expressBillCode && typeof expressBillCode === 'string') {
            whereClause.express_bill_code = {
                [sequelize_1.Op.like]: `%${expressBillCode}%`
            };
        }
        // 应付金额过滤
        if (amount && !isNaN(Number(amount))) {
            whereClause.amount = Number(amount);
        }
        const settlements = yield Settlement.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });
        console.log('获取到结算记录:', settlements.length);
        // 为每个结算记录添加关联的单据信息
        let settlementsWithDetails = yield Promise.all(settlements.map((settlement) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (settlement.bill_type === 'purchase') {
                    const purchase = yield Purchase.findByPk(settlement.bill_id, {
                        include: [
                            { model: Supplier, as: 'Supplier' },
                            { model: models_1.default.PurchaseItem, as: 'PurchaseItems', include: [{ model: models_1.default.Product, as: 'Product' }] }
                        ]
                    });
                    return Object.assign(Object.assign({}, settlement.toJSON()), { bill: purchase, supplier: purchase === null || purchase === void 0 ? void 0 : purchase.Supplier });
                }
                else if (settlement.bill_type === 'sale') {
                    const sale = yield Sale.findByPk(settlement.bill_id, {
                        include: [
                            { model: Customer, as: 'Customer' },
                            { model: models_1.default.SaleItem, as: 'SaleItems', include: [{ model: models_1.default.Product, as: 'Product' }] }
                        ]
                    });
                    return Object.assign(Object.assign({}, settlement.toJSON()), { bill: sale, customer: sale === null || sale === void 0 ? void 0 : sale.Customer });
                }
                return settlement.toJSON();
            }
            catch (error) {
                console.error('处理结算记录时出错:', error);
                return settlement.toJSON();
            }
        })));
        // 前端过滤供应商和客户名称（因为是关联数据）
        if (supplierName && typeof supplierName === 'string') {
            settlementsWithDetails = settlementsWithDetails.filter((s) => s.supplier && s.supplier.name && s.supplier.name.includes(supplierName));
        }
        if (customerName && typeof customerName === 'string') {
            settlementsWithDetails = settlementsWithDetails.filter((s) => s.customer && s.customer.name && s.customer.name.includes(customerName));
        }
        console.log('处理完成，返回结算记录');
        res.json(settlementsWithDetails);
    }
    catch (error) {
        console.error('获取结算记录失败:', error);
        res.status(500).json({ error: '获取结算记录失败', details: error.message });
    }
}));
// 创建结算记录
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bill_type, bill_id, settlement_date, amount, payment_method, remark } = req.body;
        // 检查是否是采购单结算，如果是，从采购单中获取快递单号
        let express_bill_code = undefined;
        if (bill_type === 'purchase') {
            const purchase = yield Purchase.findByPk(bill_id);
            if (purchase) {
                express_bill_code = purchase.express_bill_code;
            }
        }
        // 创建结算记录
        const settlement = yield Settlement.create({
            bill_type,
            bill_id,
            settlement_date,
            amount,
            payment_method,
            remark,
            express_bill_code
        });
        // 更新对应单据的结算状态
        if (bill_type === 'purchase') {
            const purchase = yield Purchase.findByPk(bill_id);
            if (purchase) {
                yield purchase.update({ settlement_status: '已结' });
            }
        }
        else if (bill_type === 'sale') {
            const sale = yield Sale.findByPk(bill_id);
            if (sale) {
                yield sale.update({ settlement_status: '已结' });
            }
        }
        res.status(201).json(settlement);
    }
    catch (error) {
        res.status(500).json({ error: '创建结算记录失败' });
    }
}));
// 获取采购应付账单
router.get('/purchase-bills', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { supplierName, expressBillCode, totalAmount } = req.query;
        const whereClause = {
            settlement_status: '未结'
        };
        const includeOptions = [];
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
                required: true
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
        // 如果有应付金额搜索参数
        if (totalAmount && !isNaN(Number(totalAmount))) {
            whereClause.total_amount = Number(totalAmount);
        }
        const bills = yield Purchase.findAll({
            where: whereClause,
            include: includeOptions,
            order: [['createdAt', 'DESC']]
        });
        res.json(bills);
    }
    catch (error) {
        console.error('获取应付账单失败:', error);
        res.status(500).json({ error: '获取应付账单失败' });
    }
}));
// 获取销售应收账款
router.get('/sale-bills', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerName } = req.query;
        const includeOptions = [];
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
                required: true
            });
        }
        else {
            includeOptions.push({
                model: Customer,
                as: 'Customer'
            });
        }
        const bills = yield Sale.findAll({
            where: { settlement_status: '未结' },
            include: includeOptions,
            order: [['createdAt', 'DESC']]
        });
        res.json(bills);
    }
    catch (error) {
        console.error('获取应收账款失败:', error);
        res.status(500).json({ error: '获取应收账款失败' });
    }
}));
exports.default = router;
