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
const { Customer } = models_1.default;
// 获取所有客户
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customers = yield Customer.findAll();
        res.json(customers);
    }
    catch (error) {
        res.status(500).json({ error: '获取客户列表失败' });
    }
}));
// 获取单个客户
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield Customer.findByPk(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: '客户不存在' });
        }
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: '获取客户详情失败' });
    }
}));
// 创建客户
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield Customer.create(req.body);
        res.status(201).json(customer);
    }
    catch (error) {
        res.status(500).json({ error: '创建客户失败' });
    }
}));
// 更新客户
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield Customer.findByPk(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: '客户不存在' });
        }
        yield customer.update(req.body);
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: '更新客户失败' });
    }
}));
// 删除客户
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield Customer.findByPk(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: '客户不存在' });
        }
        yield customer.destroy();
        res.json({ message: '客户删除成功' });
    }
    catch (error) {
        res.status(500).json({ error: '删除客户失败' });
    }
}));
exports.default = router;
