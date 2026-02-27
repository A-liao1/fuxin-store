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
const { Brand } = models_1.default;
// 获取所有品牌
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brands = yield Brand.findAll();
        res.json(brands);
    }
    catch (error) {
        console.error('获取品牌列表失败:', error);
        res.status(500).json({ error: '获取品牌列表失败' });
    }
}));
// 创建品牌
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: '品牌名称不能为空' });
        }
        // 检查品牌是否已存在
        const existingBrand = yield Brand.findOne({ where: { name: name.trim() } });
        if (existingBrand) {
            return res.status(400).json({ error: '品牌已存在' });
        }
        const brand = yield Brand.create({ name: name.trim() });
        res.status(201).json(brand);
    }
    catch (error) {
        console.error('创建品牌失败:', error);
        res.status(500).json({ error: '创建品牌失败' });
    }
}));
// 删除品牌
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const brand = yield Brand.findByPk(id);
        if (!brand) {
            return res.status(404).json({ error: '品牌不存在' });
        }
        // 检查是否有商品关联此品牌
        const productsCount = yield models_1.default.Product.count({ where: { brand_id: id } });
        if (productsCount > 0) {
            return res.status(400).json({ error: '该品牌下还有商品，无法删除' });
        }
        yield brand.destroy();
        res.json({ message: '品牌删除成功' });
    }
    catch (error) {
        console.error('删除品牌失败:', error);
        res.status(500).json({ error: '删除品牌失败' });
    }
}));
exports.default = router;
