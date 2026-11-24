import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  password: "123456",
  host: "localhost",
  port: 5432,
  database: "mystore",
});

db.connect();

app.use(express.static("public"));

const limit = 5;

app.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const resCustomerCount = await db.query("SELECT count(*) FROM customers");
    const totalCustomers = resCustomerCount.rows[0].count;
    const totalPages = Math.ceil(totalCustomers / limit);

    const resCustomers = await db.query(
      "SELECT * FROM customers ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const customers = resCustomers.rows;

    const resRevenue = await db.query("SELECT sum(saleamount) FROM sales");
    const totalRevenue = resRevenue.rows[0].sum || 0;

    const resSales = await db.query(`
      SELECT products.name, sales.quantity, sales.saleamount
      FROM sales
      LEFT JOIN products ON sales.productid = products.id
      ORDER BY sales.id ASC
    `);
    const sales = resSales.rows;

    const resOrders = await db.query("SELECT count(quantity) FROM orders");
    const totalOrders = resOrders.rows[0].count;

    const resIssuesCount = await db.query(
      "SELECT count(id) FROM alerts WHERE type = 'issues'"
    );
    const issuesCount = resIssuesCount.rows[0].count;

    const resIssues = await db.query(
      "SELECT * FROM alerts WHERE type = 'issues'"
    );
    const issues = resIssues.rows;

    const resNotifCount = await db.query(
      "SELECT count(id) FROM alerts WHERE type = 'notifications'"
    );
    const notificationsCount = resNotifCount.rows[0].count;

    const resNotif = await db.query(
      "SELECT * FROM alerts WHERE type = 'notifications'"
    );
    const notifications = resNotif.rows;

    const resTasks = await db.query(
      "SELECT * FROM alerts WHERE type = 'tasks'"
    );
    const tasks = resTasks.rows;

    res.render("index.ejs", {
      totalCustomers,
      customers,
      currentPage: page,
      totalPages,
      totalRevenue,
      sales,
      totalOrders,
      issuesCount,
      issues,
      notificationsCount,
      notifications,
      tasks,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
