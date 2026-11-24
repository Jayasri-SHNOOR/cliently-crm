
import { useState } from "react";
import {
  Search,
  CreditCard,
  Clock,
  CheckCircle,
  IndianRupee,
} from "lucide-react";

function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Payment records will be fetched from the backend later.
  const payments = [];

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      `${payment.customer} ${payment.paymentId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Manage and track customer payments securely.</p>
        </div>
      </div>

      <div className="payment-summary">
        <div className="payment-summary-card">
          <span>Total Payments</span>
          <h2>0</h2>
          <CreditCard size={22} />
        </div>

        <div className="payment-summary-card">
          <span>Successful Payments</span>
          <h2>0</h2>
          <CheckCircle size={22} />
        </div>

        <div className="payment-summary-card">
          <span>Pending Payments</span>
          <h2>0</h2>
          <Clock size={22} />
        </div>

        <div className="payment-summary-card">
          <span>Total Collected</span>
          <h2>{formatPrice(0)}</h2>
          <IndianRupee size={22} />
        </div>
      </div>

      <div className="leads-card payments-card">
        <div className="payments-toolbar">
          <div>
            <h2>Payment History</h2>
            <p className="section-description">
              View and track customer transactions.
            </p>
          </div>

          <div className="payments-filters">
            <div className="payments-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search customer or payment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by payment status"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="leads-table-wrapper">
          <table className="leads-table payments-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="payments-empty">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.paymentId}</td>
                    <td>{payment.customer}</td>
                    <td>{formatPrice(payment.amount)}</td>
                    <td>{payment.date}</td>
                    <td>{payment.method}</td>
                    <td>
                      <span
                        className={`payment-status ${payment.status.toLowerCase()}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-footer">
          Showing {filteredPayments.length} payment records
        </div>
      </div>
    </div>
  );
}

export default Payments;
