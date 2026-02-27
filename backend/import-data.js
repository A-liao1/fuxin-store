const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const db = new sqlite3.Database("database.db");

// 先关闭外键约束，避免删除时的约束错误
db.exec("PRAGMA foreign_keys=OFF;", (err) => {
  if (err) {
    console.error("关闭外键约束失败:", err.message);
    db.close();
    return;
  }

  // 按照正确的顺序清空表
  const clearTables = [
    "DELETE FROM InventoryLogs;",
    "DELETE FROM PurchaseItems;",
    "DELETE FROM SaleItems;",
    "DELETE FROM Settlements;",
    "DELETE FROM Purchases;",
    "DELETE FROM Sales;",
    "DELETE FROM Inventories;",
    "DELETE FROM Products;",
    "DELETE FROM Brands;",
    "DELETE FROM Suppliers;",
    "DELETE FROM Customers;",
    "DELETE FROM Users;"
  ];

  // 执行清空表的操作
  let completed = 0;
  clearTables.forEach((sql) => {
    db.exec(sql, (err) => {
      completed++;
      if (err) {
        console.error("清空表失败:", err.message);
      }
      if (completed === clearTables.length) {
        // 所有表都清空完成后，导入数据
        importData();
      }
    });
  });
});

function importData() {
  const sql = fs.readFileSync("data.sql", "utf8");
  db.exec(sql, (err) => {
    if (err) {
      console.error("导入数据失败:", err.message);
    } else {
      console.log("数据导入成功");
    }
    // 重新启用外键约束
    db.exec("PRAGMA foreign_keys=ON;", () => {
      db.close();
    });
  });
}
