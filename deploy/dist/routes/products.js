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
const { Product, Inventory } = models_1.default;
// 获取所有商品
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield Product.findAll({
            include: [
                { model: Inventory, as: 'Inventory' },
                { model: models_1.default.Brand, as: 'Brand' }
            ]
        });
        res.json(products);
    }
    catch (error) {
        console.error('获取商品列表失败:', error);
        res.status(500).json({ error: '获取商品列表失败' });
    }
}));
// 获取单个商品
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product.findByPk(req.params.id, {
            include: [
                { model: Inventory, as: 'Inventory' },
                { model: models_1.default.Brand, as: 'Brand' }
            ]
        });
        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }
        res.json(product);
    }
    catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({ error: '获取商品详情失败' });
    }
}));
// 创建商品
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('接收到创建商品请求:', req.body);
        // 设置默认值
        const productData = Object.assign(Object.assign({}, req.body), { purchase_price: req.body.purchase_price || 0, sale_price: req.body.sale_price || 0, min_stock: req.body.min_stock || 0 });
        // 确保 spec 字段为数字类型，默认为1
        if (req.body.spec !== undefined && req.body.spec !== null) {
            productData.spec = parseInt(req.body.spec, 10);
        }
        else {
            productData.spec = 1;
        }
        console.log('处理后的商品数据:', productData);
        const product = yield Product.create(productData);
        console.log('商品创建成功:', product.id);
        // 初始化库存
        yield Inventory.create({
            product_id: product.id,
            current_quantity: 0,
            avg_cost: product.purchase_price
        });
        console.log('库存初始化成功:', product.id);
        res.status(201).json(product);
    }
    catch (error) {
        console.error('创建商品失败:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: '创建商品失败', details: errorMessage });
    }
}));
// 更新商品
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }
        yield product.update(req.body);
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: '更新商品失败' });
    }
}));
// 删除商品
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }
        // 删除关联的库存记录
        yield Inventory.destroy({ where: { product_id: req.params.id } });
        yield product.destroy();
        res.json({ message: '商品删除成功' });
    }
    catch (error) {
        res.status(500).json({ error: '删除商品失败' });
    }
}));
exports.default = router;
