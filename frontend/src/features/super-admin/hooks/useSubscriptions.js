
import { useEffect, useState } from "react";

export default function useSubscriptions(activePage) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState("");

const [subscriptionQuery, setSubscriptionQuery] = useState("");
const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("All");
const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState("All");
const [subscriptionCycleFilter, setSubscriptionCycleFilter] = useState("All");

const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
const [subscriptionDialogMode, setSubscriptionDialogMode] = useState("create");

const [subscriptionDraft, setSubscriptionDraft] = useState({
  company: "",
  plan: "Starter",
  status: "Active",
  billingCycle: "Monthly",
  amount: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
});

const [subscriptionSaving, setSubscriptionSaving] = useState(false);
const [subscriptionActionMessage, setSubscriptionActionMessage] = useState("");
const [subscriptionActionError, setSubscriptionActionError] = useState("");
const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    if (!["dashboard", "billing"].includes(activePage)) return;

    let cancelled = false;

    async function loadSubscriptions() {
      setSubscriptionsLoading(true);
      setSubscriptionsError("");

      try {
        const response = await fetch(
          "http://localhost:5000/api/super-admin/subscriptions?limit=100"
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || `Request failed: ${response.status}`
          );
        }

        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.subscriptions)
            ? result.subscriptions
            : [];

        if (!cancelled) setSubscriptions(records);
      } catch (error) {
        if (!cancelled) {
          setSubscriptionsError(
            error.message || "Unable to load subscriptions."
          );
        }
      } finally {
        if (!cancelled) setSubscriptionsLoading(false);
      }
    }

    loadSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const activeSubscriptions = subscriptions.filter(
  (item) =>
    String(item.status || "Pending").toLowerCase() === "active"
);

const attentionSubscriptions = subscriptions.filter((item) =>
  ["trial", "past due"].includes(
    String(item.status || "").toLowerCase()
  )
);

const getMonthlyAmount = (item) => {
  const amount = Number(item.amount) || 0;
  const cycle = String(item.billingCycle || "Monthly").toLowerCase();

  if (cycle === "yearly") return amount / 12;
  if (cycle === "quarterly") return amount / 3;
  return amount;
};

const monthlyRecurringRevenue = activeSubscriptions.reduce(
  (total, item) => total + getMonthlyAmount(item),
  0
);

const knownPlans = ["Starter", "Pro", "Enterprise"];

const extraPlans = [
  ...new Set(
    activeSubscriptions
      .map((item) => String(item.plan || "").trim())
      .filter(
        (name) =>
          name &&
          !knownPlans.some(
            (known) => known.toLowerCase() === name.toLowerCase()
          )
      )
  ),
];

const billingPlanSummary = [...knownPlans, ...extraPlans].map(
  (planName) => {
    const matching = activeSubscriptions.filter(
      (item) =>
        String(item.plan || "").toLowerCase() ===
        planName.toLowerCase()
    );

    const monthlyRevenue = matching.reduce(
      (total, item) => total + getMonthlyAmount(item),
      0
    );

    const totalAmount = matching.reduce(
      (total, item) => total + (Number(item.amount) || 0),
      0
    );

    const cycle =
      matching.length &&
      matching.every(
        (item) =>
          String(item.billingCycle || "Monthly").toLowerCase() ===
          "yearly"
      )
        ? "Yearly"
        : "Monthly";

    return {
      name: planName,
      subscribers: matching.length,
      monthlyRevenue,
      averageAmount: matching.length
        ? totalAmount / matching.length
        : 0,
      cycle,
    };
  }
);

const filteredSubscriptions = subscriptions.filter((item) => {
  const query = subscriptionQuery.trim().toLowerCase();

  const matchesQuery =
    !query ||
    [item.company, item.plan, item.status, item.billingCycle].some(
      (value) =>
        String(value || "").toLowerCase().includes(query)
    );

  const matchesStatus =
    subscriptionStatusFilter === "All" ||
    String(item.status || "Active") === subscriptionStatusFilter;

  const matchesPlan =
    subscriptionPlanFilter === "All" ||
    String(item.plan || "") === subscriptionPlanFilter;

  const matchesCycle =
    subscriptionCycleFilter === "All" ||
    String(item.billingCycle || "Monthly") === subscriptionCycleFilter;

  return (
    matchesQuery &&
    matchesStatus &&
    matchesPlan &&
    matchesCycle
  );
});

const refreshSubscriptions = async () => {
  setSubscriptionsLoading(true);
  setSubscriptionsError("");

  try {
    const response = await fetch(
      "http://localhost:5000/api/super-admin/subscriptions?limit=100"
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Request failed: ${response.status}`
      );
    }

    const records = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.subscriptions)
        ? result.subscriptions
        : [];

    setSubscriptions(records);
  } catch (error) {
    console.error("Error refreshing subscriptions:", error);
    setSubscriptionsError(
      error.message || "Unable to refresh subscriptions."
    );
  } finally {
    setSubscriptionsLoading(false);
  }
};

const openSubscriptionForm = (mode, item = null) => {
  setSubscriptionDialogMode(mode);
  setSubscriptionActionError("");
  setSubscriptionActionMessage("");

  setSubscriptionDraft(
    item
      ? {
          company: item.company || "",
          plan: item.plan || "Starter",
          status: item.status || "Active",
          billingCycle: item.billingCycle || "Monthly",
          amount: String(item.amount ?? ""),
          startDate: item.startDate
            ? new Date(item.startDate).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          endDate: item.endDate
            ? new Date(item.endDate).toISOString().slice(0, 10)
            : "",
        }
      : {
          company: "",
          plan: "Starter",
          status: "Active",
          billingCycle: "Monthly",
          amount: "",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: "",
        }
  );

  setSubscriptionDialogOpen(true);
};

const saveSubscription = async (event) => {
  event.preventDefault();

  setSubscriptionSaving(true);
  setSubscriptionActionError("");
  setSubscriptionActionMessage("");

  try {
    const payload = {
      ...subscriptionDraft,
      company: subscriptionDraft.company.trim(),
      amount: Number(subscriptionDraft.amount),
      startDate: subscriptionDraft.startDate || undefined,
      endDate: subscriptionDraft.endDate || undefined,
    };

    if (
      !payload.company ||
      !Number.isFinite(payload.amount) ||
      payload.amount < 0
    ) {
      throw new Error(
        "Enter a company name and a valid non-negative amount."
      );
    }

    const editingId =
      subscriptionDialogMode === "edit"
        ? selectedSubscription?._id
        : null;

    if (subscriptionDialogMode === "edit" && !editingId) {
      throw new Error(
        "The subscription ID is missing. Refresh the list and try again."
      );
    }

    const response = await fetch(
      editingId
        ? `http://localhost:5000/api/super-admin/subscriptions/${editingId}`
        : "http://localhost:5000/api/super-admin/subscriptions",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Request failed: ${response.status}`
      );
    }

    setSubscriptionDialogOpen(false);
    setSelectedSubscription(null);

    setSubscriptionActionMessage(
      editingId
        ? "Subscription updated successfully."
        : "Subscription created successfully."
    );

    await refreshSubscriptions();
  } catch (error) {
    setSubscriptionActionError(
      error.message || "Unable to save subscription."
    );
  } finally {
    setSubscriptionSaving(false);
  }
};

const cancelSubscription = async (item) => {
  if (!item?._id) {
    setSubscriptionActionError("Subscription ID is missing.");
    return;
  }

  if (
    !window.confirm(
      `Cancel the subscription for ${item.company || "this company"}?`
    )
  ) {
    return;
  }

  setSubscriptionActionError("");
  setSubscriptionActionMessage("");

  try {
    const response = await fetch(
      `http://localhost:5000/api/super-admin/subscriptions/${item._id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Request failed: ${response.status}`
      );
    }

    setSelectedSubscription(null);
    setSubscriptionActionMessage(
      "Subscription cancelled successfully."
    );

    await refreshSubscriptions();
  } catch (error) {
    setSubscriptionActionError(
      error.message || "Unable to cancel subscription."
    );
  }
};

  return {
    subscriptions,
    subscriptionsLoading,
    subscriptionsError,
    refreshSubscriptions,

    subscriptionQuery,
    setSubscriptionQuery,
    subscriptionStatusFilter,
    setSubscriptionStatusFilter,
    subscriptionPlanFilter,
    setSubscriptionPlanFilter,
    subscriptionCycleFilter,
    setSubscriptionCycleFilter,

    subscriptionDialogOpen,
    setSubscriptionDialogOpen,
    subscriptionDialogMode,
    subscriptionDraft,
    setSubscriptionDraft,
    subscriptionSaving,
    subscriptionActionMessage,
    subscriptionActionError,
    selectedSubscription,
    setSelectedSubscription,

    activeSubscriptions,
    attentionSubscriptions,
    monthlyRecurringRevenue,
    billingPlanSummary,
    filteredSubscriptions,
    formatINR,

    openSubscriptionForm,
    saveSubscription,
    cancelSubscription,
  };
}

