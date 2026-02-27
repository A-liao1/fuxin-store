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
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User = (sequelize) => {
    const UserModel = sequelize.define('User', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        username: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: sequelize_1.DataTypes.STRING,
            defaultValue: 'admin'
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        }
    }, {
        tableName: 'Users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: (user) => __awaiter(void 0, void 0, void 0, function* () {
                if (user.password) {
                    user.password = yield bcryptjs_1.default.hash(user.password, 10);
                }
            }),
            beforeUpdate: (user) => __awaiter(void 0, void 0, void 0, function* () {
                if (user.changed('password')) {
                    user.password = yield bcryptjs_1.default.hash(user.password, 10);
                }
            })
        }
    });
    // 实例方法：比较密码
    UserModel.prototype.comparePassword = function (password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcryptjs_1.default.compare(password, this.password);
        });
    };
    return UserModel;
};
exports.default = User;
