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
const models_1 = require("../models");
const models_2 = __importDefault(require("../models"));
const { User } = models_2.default;
// 初始化默认管理员用户
const initAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 同步数据库结构
        yield models_1.sequelize.sync({ force: false });
        console.log('数据库结构同步完成');
        // 检查是否已存在管理员用户
        const existingAdmin = yield User.findOne({ where: { username: 'admin' } });
        if (!existingAdmin) {
            // 创建默认管理员用户
            yield User.create({
                username: 'admin',
                password: 'admin123', // 默认密码，实际应用中应该使用环境变量或加密方式
                name: '系统管理员',
                role: 'admin'
            });
            console.log('默认管理员用户创建成功');
            console.log('用户名: admin');
            console.log('密码: admin123');
        }
        else {
            console.log('管理员用户已存在，跳过创建');
        }
    }
    catch (error) {
        console.error('创建管理员用户失败:', error);
    }
    finally {
        yield models_1.sequelize.close();
    }
});
// 运行初始化
initAdminUser();
