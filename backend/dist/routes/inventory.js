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
const { Inventory, Product, InventoryLog } = models_1.default;
// 获取实时库存
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventory = yield Inventory.findAll({
            include: [{ model: Product, as: 'Product' }]
        });
        res.json(inventory);
    }
    catch (error) {
        res.status(500).json({ error: '获取库存列表失败' });
    }
}));
// 获取库存流水
router.get('/logs/:product_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield InventoryLog.findAll({
            where: { product_id: req.params.product_id },
            include: [{ model: Product, as: 'Product' }],
            order: [['create_time', 'DESC']]
        });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: '获取库存流水失败' });
    }
}));
// 获取所有库存流水
router.get('/logs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield InventoryLog.findAll({
            include: [{ model: Product, as: 'Product' }],
            order: [['create_time', 'DESC']]
        });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: '获取库存流水失败' });
    }
}));
// 获取单个商品库存
router.get('/:product_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventory = yield Inventory.findOne({
            where: { product_id: req.params.product_id },
            include: [{ model: Product, as: 'Product' }]
        });
        if (!inventory) {
            return res.status(404).json({ error: '库存记录不存在' });
        }
        res.json(inventory);
    }
    catch (error) {
        res.status(500).json({ error: '获取库存详情失败' });
    }
}));
exports.default = router;
