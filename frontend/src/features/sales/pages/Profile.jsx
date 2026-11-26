
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Pencil,
  Save,
  X,
  ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/sales/profile";

const defaultProfile = {
  name: "",
  email: "",
  phone: "",
  role: "Sales Executive",
  department: "Sales",
  location: "",
  joinedDate: "",
};

function normalizeProfile(data) {
  const item = data?.profile || data?.user || data;

  return {
    ...defaultProfile,
    name: item?.name || "",
    email: item?.email || "",
    phone: item?.phone || "",
    role: item?.role || item?.designation || "Sales Executive",
    department: item?.department || "Sales",
    location: item?.location || "",
    joinedDate: item?.joinedDate || item?.joiningDate || item?.createdAt || "",
    _id: item?._id || item?.id,
  };
}

function formatJoinedDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [form, setForm] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load profile.");
      }

      const loadedProfile = normalizeProfile(data);
      setProfile(loadedProfile);
      setForm(loadedProfile);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile.");
      }

      const updatedProfile = normalizeProfile(
        data?.profile || data?.user
          ? data
          : { ...profile, ...form }
      );

      setProfile(updatedProfile);
      setForm(updatedProfile);
      setIsEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(profile);
    setIsEditing(false);
    setSaved(false);
    setError("");
  }

  if (loading) {
    return <div className="page-container">Loading profile...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>View and manage your sales executive profile.</p>
        </div>

        {!isEditing ? (
          <button
            className="profile-edit-button"
            onClick={() => {
              setForm(profile);
              setIsEditing(true);
              setSaved(false);
              setError("");
            }}
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        ) : (
          <button className="profile-cancel-button" onClick={handleCancel}>
            <X size={17} />
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="profile-error" role="alert">
          {error}
          <button type="button" onClick={loadProfile}>
            Retry
          </button>
        </div>
      )}

      {saved && (
        <div className="profile-success" role="status">
          Profile updated successfully.
        </div>
      )}

      <div className="profile-layout">
        <section className="profile-card profile-overview">
          <div className="profile-cover" />

          <div className="profile-avatar">
            <UserRound size={42} />
          </div>

          <h2>{profile.name || "Name not provided"}</h2>
          <p className="profile-role">{profile.role}</p>

          <span className="profile-active">
            <span />
            Active
          </span>

          <div className="profile-overview-divider" />

          <div className="profile-overview-item">
            <BriefcaseBusiness size={18} />
            <span>{profile.department} Department</span>
          </div>

          <div className="profile-overview-item">
            <MapPin size={18} />
            <span>{profile.location || "Location not provided"}</span>
          </div>

          <div className="profile-overview-item">
            <CalendarDays size={18} />
            <span>Joined {formatJoinedDate(profile.joinedDate)}</span>
          </div>
        </section>

        <section className="profile-card profile-details">
          <div className="profile-section-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Keep your contact details up to date.</p>
            </div>
            <UserRound size={22} />
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="profile-name">Full Name</label>
                <div className="profile-input-wrap">
                  <UserRound size={17} />
                  <input
                    id="profile-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!isEditing || saving}
                    required
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email Address</label>
                <div className="profile-input-wrap">
                  <Mail size={17} />
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!isEditing || saving}
                    required
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-phone">Phone Number</label>
                <div className="profile-input-wrap">
                  <Phone size={17} />
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    disabled={!isEditing || saving}
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-role">Job Title</label>
                <div className="profile-input-wrap">
                  <BriefcaseBusiness size={17} />
                  <input
                    id="profile-role"
                    name="role"
                    value={form.role}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-department">Department</label>
                <input
                  id="profile-department"
                  className="profile-plain-input"
                  name="department"
                  value={form.department}
                  disabled
                  readOnly
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-location">Location</label>
                <div className="profile-input-wrap">
                  <MapPin size={17} />
                  <input
                    id="profile-location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    disabled={!isEditing || saving}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>

          <div className="profile-security-note">
            <ShieldCheck size={21} />
            <div>
              <strong>Account Information</strong>
              <p>
                Your role and department are managed by the organization.
                Contact your administrator if these details need changing.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;