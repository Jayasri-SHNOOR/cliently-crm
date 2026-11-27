import { Package, CheckCircle2, CircleSlash, Layers } from "lucide-react";
import TablePage from "../../../shared/ui/TablePage";
import StatusBadge from "../../../shared/ui/StatusBadge";
import PageState from "../../../shared/ui/PageState";
import { inr } from "../../../shared/ui/format";
import { salesApi } from "../services/salesApi";
import useLoad from "../services/useLoad";

const columns = [
  { key: "name", label: "Product", render: (r) => (<div><strong>{r.name}</strong>{r.description && <div style={{ fontSize: 11, color: "var(--muted-text)" }}>{r.description}</div>}</div>) },
  { key: "code", label: "Code" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
  { key: "price", label: "Price", render: (r) => inr(r.price) },
  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

export default function Products() {
  const { data, loading, error, reload } = useLoad(salesApi.products);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  const rows = (data.products || []).map((p) => ({
    ...p,
    id: p._id,
    code: p.code || "—",
    category: p.category || "Uncategorized",
    type: p.type || "Product",
    status: p.status || "Active",
  }));
  const categories = [...new Set(rows.map((r) => r.category))];

  return (
    <TablePage
      title="Products" subtitle="The product and service catalogue managed by your Client Admin"
      kpis={[
        { label: "Total", value: rows.length, icon: Package },
        { label: "Categories", value: categories.length, icon: Layers },
        { label: "Active", value: rows.filter((r) => r.status === "Active").length, icon: CheckCircle2 },
        { label: "Inactive", value: rows.filter((r) => r.status !== "Active").length, icon: CircleSlash },
      ]}
      columns={columns} rows={rows}
      filters={[
        { key: "category", label: "Categories", options: categories },
        { key: "status", label: "Statuses", options: ["Active", "Inactive"] },
      ]}
      searchKeys={["name", "code", "category"]} searchPlaceholder="Search products..."
      panelTitle="Product Catalogue"
    />
  );
}
