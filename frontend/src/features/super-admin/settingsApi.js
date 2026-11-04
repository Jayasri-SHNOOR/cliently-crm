
import { apiFetch } from "../../lib/api";

// Supports:
// http://localhost:5000
// http://localhost:5000/api

export const SETTINGS_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DEFAULT_SETTINGS = {
  organization: {
    companyName: "Cliently",
    supportEmail: "",
  },

  regional: {
    timezone: "Asia/Kolkata",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    currency: "INR",
    weekStartsOn: "Monday",
  },

  notifications: {
    emailEnabled: true,
    systemAlertsEnabled: true,
  },

  businessHours: {
    enabled: false,
    startTime: "09:00",
    endTime: "18:00",
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],
  },

  security: {
    twoFactorRequired: false,
    sessionTimeoutMinutes: 30,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialCharacter: false,
  },

  dataSharing: {
    allowDataExport: true,
    allowExternalSharing: false,
  },
};

export const SETTINGS_SECTIONS = {
  Organization: {
    organization: ["companyName", "supportEmail"],
    notifications: ["emailEnabled", "systemAlertsEnabled"],
  },

  "Regional Settings": {
    regional: [
      "timezone",
      "language",
      "dateFormat",
      "timeFormat",
      "currency",
      "weekStartsOn",
    ],
  },

  "Business Hours": {
    businessHours: [
      "enabled",
      "startTime",
      "endTime",
      "workingDays",
    ],
  },

  "Data Sharing": {
    dataSharing: [
      "allowDataExport",
      "allowExternalSharing",
    ],
  },

  Authentication: {
    security: ["twoFactorRequired"],
  },

  "Login & Session Security": {
    security: ["sessionTimeoutMinutes"],
  },

  "Password Policy": {
    security: [
      "passwordMinLength",
      "requireUppercase",
      "requireNumber",
      "requireSpecialCharacter",
    ],
  },
};

export const NUMBER_FIELDS = [
  "sessionTimeoutMinutes",
  "passwordMinLength",
];

export const SETTINGS_MENU = [
  {
    title: "GENERAL",
    items: [
      ["Organization", "▣"],
      ["Regional Settings", "◷"],
      ["Business Hours", "◫"],
    ],
  },
  {
    title: "USERS & CONTROL",
    items: [
      ["Users", "♙"],
      ["Roles & Profiles", "♙"],
      ["Permissions", "♙"],
      ["Data Sharing", "♙"],
    ],
  },
  {
    title: "SECURITY",
    items: [
      ["Authentication", "⌾"],
      ["Login & Session Security", "⌾"],
      ["Password Policy", "⌾"],
    ],
  },
  {
    title: "CUSTOMIZATION",
    items: [
      ["CRM Modules", "▦"],
      ["Fields & Layouts", "▦"],
      ["Pipelines", "▦"],
    ],
  },
  {
    title: "DATA ADMINISTRATION",
    items: [
      ["Import / Export", "⇅"],
      ["Data Backup", "⇅"],
      ["Storage", "⇅"],
      ["Audit Log", "⇅"],
    ],
  },
  {
    title: "INTEGRATIONS",
    items: [
      ["API", "⌘"],
      ["Webhooks", "⌘"],
      ["Connected Services", "⌘"],
    ],
  },
  {
    title: "SUBSCRIPTION",
    items: [
      ["Plans & Licenses", "◇"],
      ["Billing", "◇"],
      ["Feature Access", "◇"],
    ],
  },
];

export const SETTINGS_DESCRIPTIONS = {
  Organization:
    "Manage the company name and support contact saved for Cliently.",

  "Regional Settings":
    "Choose the timezone, language, date/time formats and currency.",

  "Business Hours":
    "Set working days and opening and closing times.",

  "Data Sharing":
    "Choose how data may be exported or shared.",

  Authentication:
    "Saved authentication preference. Sign-in itself is handled by Firebase.",

  "Login & Session Security":
    "Saved session timeout preference.",

  "Password Policy":
    "Saved password policy values.",
};

export function normalizeSettings(data = {}) {
  const result = {};

  Object.entries(DEFAULT_SETTINGS).forEach(
    ([section, defaults]) => {
      result[section] = {};

      Object.entries(defaults).forEach(([field, fallback]) => {
        const value = data?.[section]?.[field];

        const chosen =
          value === undefined || value === null
            ? fallback
            : value;

        result[section][field] = Array.isArray(chosen)
          ? [...chosen]
          : chosen;
      });
    }
  );

  return result;
}

// CRM session-based Settings API
async function request(method, body) {
  const result = await apiFetch(
    "/api/super-admin/settings",
    {
      method,
      ...(body !== undefined ? { body } : {}),
    }
  );

  return result.data ?? result.settings ?? result;
}

export const fetchSettings = () => request("GET");

export const patchSettings = (changes) =>
  request("PATCH", changes);

// Compatibility with SuperAdminDashboard.jsx
export const getSettings = fetchSettings;
export const updateSettings = patchSettings;

