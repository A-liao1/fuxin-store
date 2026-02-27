const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("database.db");

// 验证关键表的数据数量
const tablesToCheck = [
  { name: "Brands", expected: 3 },
  { name: "Products", expected: 4 },
  { name: "Suppliers", expected: 3 },
  { name: "Customers", expected: 3 },
  { name: "Purchases", expected: 3 },
  { name: "Sales", expected: 3 },
  { name: "Inventories", expected: 4 },
  { name: "Users", expected: 1 }
];

let checked = 0;
let allCorrect = true;

tablesToCheck.forEach((table) => {
  db.get(`SELECT count(*) as count FROM ${table.name}`, (err, row) => {
    checked++;
    if (err) {
      console.error(`查询${table.name}失败:`, err.message);
      allCorrect = false;
    } else {
      const actual = row.count;
      const status = actual === table.expected ? "✓" : "✗";
      console.log(`${status} ${table.name}: 期望 ${table.expected}, 实际 ${actual}`);
      if (actual !== table.expected) {
        allCorrect = false;
      }
    }
    if (checked === tablesToCheck.length) {
      console.log("\n验证完成:", allCorrect ? "数据导入正确" : "数据导入存在问题");
      db.close();
    }
  });
});
