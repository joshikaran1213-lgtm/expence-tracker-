import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const addTransaction = (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      amount: Number(amount),
      category,
      description: description || category,
      date: new Date().toISOString().split("T")[0],
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    setAmount("");
    setDescription("");
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // Only transactions from the selected month
  const monthlyTransactions = transactions.filter((item) =>
    item.date.startsWith(selectedMonth)
  );

  const totalIncome = monthlyTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = totalIncome - totalExpense;

  // Category-wise expenses for selected month
  const expenseByCategory = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((result, item) => {
      result[item.category] =
        (result[item.category] || 0) + item.amount;

      return result;
    }, {});

  const highestCategory = Object.entries(expenseByCategory).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // Simple chart percentages
  const totalForChart = totalIncome + totalExpense;

  const incomePercentage =
    totalForChart > 0
      ? (totalIncome / totalForChart) * 100
      : 0;

  const expensePercentage =
    totalForChart > 0
      ? (totalExpense / totalForChart) * 100
      : 0;

  const exportCSV = () => {
    if (monthlyTransactions.length === 0) {
      alert("No transactions for the selected month.");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Category",
      "Description",
      "Amount",
    ];

    const rows = monthlyTransactions.map((item) => [
      item.date,
      item.type,
      item.category,
      item.description,
      item.amount,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `expense-report-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (monthlyTransactions.length === 0) {
      alert("No transactions for the selected month.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Expense Tracker Monthly Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Month: ${selectedMonth}`, 14, 30);
    doc.text(`Total Income: Rs. ${totalIncome.toFixed(2)}`, 14, 40);
    doc.text(`Total Expenses: Rs. ${totalExpense.toFixed(2)}`, 14, 48);
    doc.text(`Balance: Rs. ${balance.toFixed(2)}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [
        ["Date", "Type", "Category", "Description", "Amount"],
      ],
      body: monthlyTransactions.map((item) => [
        item.date,
        item.type,
        item.category,
        item.description,
        `Rs. ${item.amount.toFixed(2)}`,
      ]),
    });

    doc.save(`expense-report-${selectedMonth}.pdf`);
  };

  return (
    <div className="app">
      <header>
        <h1>💰 Expense Tracker</h1>
        <p>
          Track income, expenses and monthly financial insights
        </p>
      </header>

      <main>
        {/* Monthly Report Selector */}
        <section className="panel month-selector">
          <h2>📅 Monthly Report</h2>

          <label>Select Month</label>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </section>

        {/* Summary Cards */}
        <section className="summary">
          <div className="card income">
            <h3>Total Income</h3>
            <h2>₹{totalIncome.toFixed(2)}</h2>
          </div>

          <div className="card expense">
            <h3>Total Expenses</h3>
            <h2>₹{totalExpense.toFixed(2)}</h2>
          </div>

          <div className="card balance">
            <h3>Balance</h3>
            <h2>₹{balance.toFixed(2)}</h2>
          </div>
        </section>

        {/* Add Transaction + Chart */}
        <section className="content-grid">
          <div className="panel">
            <h2>➕ Add Transaction</h2>

            <form onSubmit={addTransaction}>
              <label>Type</label>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <label>Amount</label>

              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <label>Category</label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Entertainment</option>
                <option>Health</option>
                <option>Education</option>
                <option>Salary</option>
                <option>Other</option>
              </select>

              <label>Description</label>

              <input
                type="text"
                placeholder="Example: Grocery shopping"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <button type="submit">
                Add Transaction
              </button>
            </form>
          </div>

          {/* Income vs Expense Chart */}
          <div className="panel">
            <h2>📊 Income vs Expense</h2>

            {totalForChart === 0 ? (
              <p className="empty">
                Add transactions to see the chart.
              </p>
            ) : (
              <div className="bar-chart">
                <div className="chart-row">
                  <div className="chart-label">
                    Income
                  </div>

                  <div className="bar-background">
                    <div
                      className="income-bar"
                      style={{
                        width: `${incomePercentage}%`,
                      }}
                    />
                  </div>

                  <strong>
                    ₹{totalIncome.toFixed(2)}
                  </strong>
                </div>

                <div className="chart-row">
                  <div className="chart-label">
                    Expenses
                  </div>

                  <div className="bar-background">
                    <div
                      className="expense-bar"
                      style={{
                        width: `${expensePercentage}%`,
                      }}
                    />
                  </div>

                  <strong>
                    ₹{totalExpense.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="panel">
          <h2>📂 Expense Categories</h2>

          {Object.keys(expenseByCategory).length === 0 ? (
            <p className="empty">
              No expenses for this month.
            </p>
          ) : (
            <div className="category-list">
              {Object.entries(expenseByCategory).map(
                ([categoryName, value]) => {
                  const percentage =
                    totalExpense > 0
                      ? (value / totalExpense) * 100
                      : 0;

                  return (
                    <div
                      className="category-item"
                      key={categoryName}
                    >
                      <div>
                        <strong>{categoryName}</strong>
                        <span>
                          ₹{value.toFixed(2)}
                        </span>
                      </div>

                      <div className="category-background">
                        <div
                          className="category-bar"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* Transactions */}
        <section className="panel">
          <div className="section-header">
            <h2>📋 Transactions</h2>

            <div>
              <button
                onClick={exportCSV}
                className="export"
              >
                Export CSV
              </button>

              <button
                onClick={exportPDF}
                className="export"
              >
                Download PDF
              </button>
            </div>
          </div>

          {monthlyTransactions.length === 0 ? (
            <p className="empty">
              No transactions for this month.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyTransactions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>

                      <td>
                        {item.type === "income"
                          ? "Income"
                          : "Expense"}
                      </td>

                      <td>{item.category}</td>

                      <td>{item.description}</td>

                      <td>
                        {item.type === "income"
                          ? "+"
                          : "-"}
                        ₹{item.amount.toFixed(2)}
                      </td>

                      <td>
                        <button
                          className="delete"
                          onClick={() =>
                            deleteTransaction(item.id)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Monthly Insights */}
        <section className="panel">
          <h2>💡 Monthly Insights</h2>

          {monthlyTransactions.length === 0 ? (
            <p>
              Add some transactions to generate monthly
              insights.
            </p>
          ) : (
            <div className="insight">
              <p>
                You earned{" "}
                <strong>
                  ₹{totalIncome.toFixed(2)}
                </strong>{" "}
                this month.
              </p>

              <p>
                You spent{" "}
                <strong>
                  ₹{totalExpense.toFixed(2)}
                </strong>{" "}
                this month.
              </p>

              <p>
                Your current balance is{" "}
                <strong>
                  ₹{balance.toFixed(2)}
                </strong>
                .
              </p>

              {highestCategory && (
                <p>
                  🏆 Your highest expense category is{" "}
                  <strong>
                    {highestCategory[0]}
                  </strong>{" "}
                  with{" "}
                  <strong>
                    ₹{highestCategory[1].toFixed(2)}
                  </strong>
                  .
                </p>
              )}

              {totalExpense > totalIncome ? (
                <p>
                  ⚠️ Your expenses are higher than your
                  income this month.
                </p>
              ) : (
                <p>
                  ✅ Your income is higher than your
                  expenses this month.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;