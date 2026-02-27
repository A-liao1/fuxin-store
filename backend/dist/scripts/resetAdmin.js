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
// 重置或创建管理员用户
const resetAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 同步数据库结构
        yield models_1.sequelize.sync({ force: false });
        console.log('数据库结构同步完成');
        // 查找或创建管理员用户
        let adminUser = yield User.findOne({ where: { username: 'admin' } });
        if (adminUser) {
            // 更新现有管理员用户的密码
            adminUser.password = 'admin123';
            yield adminUser.save();
            console.log('管理员用户密码重置成功');
            console.log('用户名: admin');
            console.log('密码: admin123');
        }
        else {
            // 创建新的管理员用户
            adminUser = yield User.create({
                username: 'admin',
                password: 'admin123',
                name: '系统管理员',
                role: 'admin'
            });
            console.log('默认管理员用户创建成功');
            console.log('用户名: admin');
            console.log('密码: admin123');
        }
        console.log('管理员用户信息:', {
            id: adminUser.id,
            username: adminUser.username,
            name: adminUser.name,
            role: adminUser.role
        });
    }
    catch (error) {
        console.error('重置管理员用户失败:', error);
    }
    finally {
        yield models_1.sequelize.close();
    }
});
// 运行重置
resetAdminUser();
