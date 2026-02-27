import express from 'express';
import models from '../models';

const router = express.Router();
const { Customer } = models;

// 获取所有客户
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

// 获取单个客户
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: '获取客户详情失败' });
  }
});

// 创建客户
router.post('/', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: '创建客户失败' });
  }
});

// 更新客户
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    
    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: '更新客户失败' });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    
    await customer.destroy();
    res.json({ message: '客户删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除客户失败' });
  }
});

export default router;