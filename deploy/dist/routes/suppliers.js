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
const { Supplier } = models_1.default;
// 获取所有供应商
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const suppliers = yield Supplier.findAll();
        res.json(suppliers);
    }
    catch (error) {
        res.status(500).json({ error: '获取供应商列表失败' });
    }
}));
// 获取单个供应商
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supplier = yield Supplier.findByPk(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: '供应商不存在' });
        }
        res.json(supplier);
    }
    catch (error) {
        res.status(500).json({ error: '获取供应商详情失败' });
    }
}));
// 创建供应商
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supplier = yield Supplier.create(req.body);
        res.status(201).json(supplier);
    }
    catch (error) {
        res.status(500).json({ error: '创建供应商失败' });
    }
}));
// 更新供应商
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supplier = yield Supplier.findByPk(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: '供应商不存在' });
        }
        yield supplier.update(req.body);
        res.json(supplier);
    }
    catch (error) {
        res.status(500).json({ error: '更新供应商失败' });
    }
}));
// 删除供应商
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supplier = yield Supplier.findByPk(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: '供应商不存在' });
        }
        yield supplier.destroy();
        res.json({ message: '供应商删除成功' });
    }
    catch (error) {
        res.status(500).json({ error: '删除供应商失败' });
    }
}));
exports.default = router;
