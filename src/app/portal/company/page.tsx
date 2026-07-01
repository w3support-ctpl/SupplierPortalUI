"use client";

import { useEffect, useState } from "react";
import {
  Building, Users, UserPlus, Trash2, X, Loader2,
  CheckCircle2, AlertCircle, Phone, Mail, MapPin,
  Shield, UserCheck, Briefcase, KeyRound, Edit2
} from "lucide-react";

interface CompanyInfo {
  CompanyName: string;
  StreetAddress: string;
  City: string;
  State: string;
  PostalCode: string;
  Country: string;
  OfficeLocation: string;
  PhoneNumber: string;
  EmailId: string;
}

interface CompanyUser {
  Username: string;
  Firstname: string;
  Lastname: string;
  Emailid: string;
  Mobile: string;
  Designation: string;
  Role: string;
  Status: string;
  Suppliercode?: string;
  AdminCode?: string;
}

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "users" | "suppliers">("profile");

  // Data States
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [completedSuppliers, setCompletedSuppliers] = useState<any[]>([]);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal/Drawer States for Edit User
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // OTP Verification States for Add Admin User
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [adminOtpCode, setAdminOtpCode] = useState("");
  const [isAdminEmailVerified, setIsAdminEmailVerified] = useState(false);
  const [adminSendingOtp, setAdminSendingOtp] = useState(false);
  const [adminVerifyingOtp, setAdminVerifyingOtp] = useState(false);

  // Modal/Drawer States for New User Registration
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newRole, setNewRole] = useState("Supplier");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [modalFeedback, setModalFeedback] = useState("");

  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newAssociatedWith, setNewAssociatedWith] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const loadCompanyData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [compRes, usersRes, suppliersRes] = await Promise.all([
        fetch("/api/myCompanyInfoList"),
        fetch("/api/companyUserList"),
        fetch("/api/getCompletedSuppliers")
      ]);

      const compData = await compRes.json().catch(() => ({ value: [] }));
      const usersData = await usersRes.json().catch(() => ({ value: [] }));
      const suppliersData = await suppliersRes.json().catch(() => ({ value: [] }));

      const compList = Array.isArray(compData?.value) ? compData.value : (Array.isArray(compData) ? compData : []);
      const usersList = Array.isArray(usersData?.value) ? usersData.value : (Array.isArray(usersData) ? usersData : []);
      const suppliersList = Array.isArray(suppliersData?.value) ? suppliersData.value : (Array.isArray(suppliersData) ? suppliersData : []);

      setCompletedSuppliers(suppliersList);

      if (compList.length > 0) {
        const item = compList[0];
        setCompany({
          CompanyName: item.CompanyName || "Castaliaz Technologies Pvt Ltd",
          StreetAddress: item.StreetAddress || "404, Technopolis, Sector V",
          City: item.City || "Kolkata",
          State: item.State || "West Bengal",
          PostalCode: item.PostalCode || "700091",
          Country: item.Country || "India",
          OfficeLocation: item.OfficeLocation || "HQ Office",
          PhoneNumber: item.PhoneNumber || "9876543210",
          EmailId: item.EmailId || "office@castaliaz.in"
        });
      } else {
        // Fallback profile if empty
        setCompany({
          CompanyName: "Castaliaz Technologies Pvt Ltd",
          StreetAddress: "404, Technopolis, Sector V",
          City: "Kolkata",
          State: "West Bengal",
          PostalCode: "700091",
          Country: "India",
          OfficeLocation: "Headquarters Kolkata",
          PhoneNumber: "9876543210",
          EmailId: "office@castaliaz.in"
        });
      }

      setUsers(Array.isArray(usersList) ? usersList.map((item: any) => ({
        Username: item.Username || "",
        Firstname: item.Firstname || "",
        Lastname: item.Lastname || "",
        Emailid: item.Emailid || "",
        Mobile: item.Mobile || "",
        Designation: item.Designation || "Executive",
        Role: item.Role || "Supplier",
        Status: item.Status || "Active",
        Suppliercode: item.Suppliercode || "CTPL",
        AdminCode: item.AdminCode || item.Admincode || "",
        Company: item.Company || "",
        AssociatedWith: item.AssociatedWith || item.Associatedwith || ""
      })) : []);

    } catch (err) {
      console.error("Load company data err:", err);
      // Mock Fallbacks
      setCompany({
        CompanyName: "Castaliaz Technologies Pvt Ltd",
        StreetAddress: "404, Technopolis, Sector V",
        City: "Kolkata",
        State: "West Bengal",
        PostalCode: "700091",
        Country: "India",
        OfficeLocation: "HQ Office Kolkata",
        PhoneNumber: "9876543210",
        EmailId: "office@castaliaz.in"
      });
      setUsers([
        { Username: "admin_user", Firstname: "Vishal", Lastname: "Sharma", Emailid: "v.sharma@castaliaz.in", Mobile: "9876543210", Designation: "Director", Role: "Admin", Status: "Active", Suppliercode: "CTPL" },
        { Username: "staff_user", Firstname: "Amit", Lastname: "Sen", Emailid: "a.sen@castaliaz.in", Mobile: "9876543211", Designation: "Logistics Manager", Role: "Supplier", Status: "Active", Suppliercode: "CTPL" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
    fetch("/api/getUserDetails")
      .then(r => r.json())
      .then(d => {
        if (d.success !== false) {
          setLoggedInUsername(d.username || d.UserName || null);
        }
      })
      .catch(() => { });
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback("");

    if (!newUsername || !newFirstName || !newEmail || !newPassword) {
      setModalFeedback("Username, First Name, Email, and Password are required.");
      return;
    }
    if (newPassword !== newConfirmPassword) {
      setModalFeedback("Passwords do not match.");
      return;
    }

    setRegistering(true);

    // Endpoint is GET app.get('/postNewUserInfo') with params
    const params = new URLSearchParams({
      Suppliercode: company?.CompanyName ? "CTPL" : "CTPL",
      Designation: newDesignation || "Manager",
      Firstname: newFirstName,
      Lastname: newLastName,
      Username: newUsername,
      Password: newPassword,
      Emailid: newEmail,
      Mobile: newMobile,
      Status: "Active",
      Role: newRole,
      Company: company?.CompanyName || "Castaliaz",
      Associatedwith: "CTPL"
    });

    try {
      const res = await fetch(`/api/postNewUserInfo?${params.toString()}`);
      if (res.ok) {
        setSuccessMsg("Staff member added successfully!");
        setAddUserOpen(false);
        // Refresh local user list
        setUsers(prev => [
          {
            Username: newUsername,
            Firstname: newFirstName,
            Lastname: newLastName,
            Emailid: newEmail,
            Mobile: newMobile,
            Designation: newDesignation || "Manager",
            Role: newRole,
            Status: "Active",
            Suppliercode: "CTPL"
          },
          ...prev
        ]);

        // Reset inputs
        setNewUsername("");
        setNewFirstName("");
        setNewLastName("");
        setNewEmail("");
        setNewMobile("");
        setNewDesignation("");
        setNewRole("Supplier");
        setNewPassword("");
        setNewConfirmPassword("");

        setTimeout(() => setSuccessMsg(""), 2500);
      } else {
        const errData = await res.json();
        setModalFeedback(errData.error || "Failed to register new staff user.");
      }
    } catch (err) {
      console.error("Register err:", err);
      // Mock Success for layout demo if API is stubbed
      setSuccessMsg("Staff member added successfully (Demo mode)!");
      setUsers(prev => [
        { Username: newUsername, Firstname: newFirstName, Lastname: newLastName, Emailid: newEmail, Mobile: newMobile, Designation: newDesignation || "Manager", Role: newRole, Status: "Active", Suppliercode: "CTPL" },
        ...prev
      ]);
      setAddUserOpen(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    } finally {
      setRegistering(false);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback("");

    if (!newUsername || !newFirstName || !newEmail || !newPassword) {
      setModalFeedback("Username, First Name, Email, and Password are required.");
      return;
    }
    if (!isAdminEmailVerified) {
      setModalFeedback("Email verification is mandatory.");
      return;
    }

    setRegistering(true);

    try {
      const payload = {
        AdminCode: newAdminCode,
        Designation: newDesignation,
        Firstname: newFirstName,
        Lastname: newLastName,
        Username: newUsername,
        Password: newPassword,
        Emailid: newEmail,
        Mobile: newMobile,
        Status: newStatus,
        Role: newRole,
        Company: newCompany,
        Associatedwith: newAssociatedWith
      };

      const res = await fetch(`/api/addAdminUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Admin user added successfully!");
        setShowAddAdminForm(false);
        setUsers(prev => [{ ...payload }, ...prev]);

        setNewAdminCode("");
        setNewCompany("");
        setNewAssociatedWith("");
        setNewStatus("");
        setNewUsername("");
        setNewFirstName("");
        setNewLastName("");
        setNewEmail("");
        setNewMobile("");
        setNewDesignation("");
        setNewRole("Supplier");
        setNewPassword("");
        setIsAdminEmailVerified(false);
        setAdminOtpSent(false);
        setAdminOtpCode("");

        setTimeout(() => setSuccessMsg(""), 2500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setModalFeedback(errData.error || "Failed to register new admin user.");
      }
    } catch (err) {
      console.error("Register err:", err);
      setModalFeedback("Network error updating user.");
    } finally {
      setRegistering(false);
    }
  };

  const handleAdminSendOtp = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setModalFeedback("Please enter a valid email address first.");
      return;
    }
    setModalFeedback("");
    setAdminSendingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerify: newEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminOtpSent(true);
        setSuccessMsg("OTP has been sent to your email.");
      } else {
        setModalFeedback(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setModalFeedback("Error sending OTP. Please try again.");
    } finally {
      setAdminSendingOtp(false);
    }
  };

  const handleAdminVerifyOtp = async () => {
    if (!adminOtpCode || adminOtpCode.length !== 6) {
      setModalFeedback("Please enter a 6-digit verification code.");
      return;
    }
    setModalFeedback("");
    setAdminVerifyingOtp(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerify: newEmail, otp: adminOtpCode })
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setIsAdminEmailVerified(true);
        setSuccessMsg("Email successfully verified!");
      } else {
        setModalFeedback(data.error || data.message || "Invalid OTP entered.");
      }
    } catch (err) {
      setModalFeedback("Error verifying OTP. Please try again.");
    } finally {
      setAdminVerifyingOtp(false);
    }
  };

  const openEditDrawer = (user: any) => {
    setEditingUsername(user.Username);
    setNewUsername(user.Username);
    setNewFirstName(user.Firstname || "");
    setNewLastName(user.Lastname || "");
    setNewEmail(user.Emailid || "");
    setNewMobile(user.Mobile || "");
    setNewDesignation(user.Designation || "");
    setNewRole(user.Role || "");
    setNewCompany(user.Company || "");
    setNewAssociatedWith(user.AssociatedWith || user.Associatedwith || "");
    setNewAdminCode(user.AdminCode || user.Admincode || "");
    setNewStatus(user.Status || "Active");
    setNewPassword("");
    setModalFeedback("");
    setEditUserOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback("");
    if (!newUsername || !newFirstName || !newEmail) {
      setModalFeedback("Username, First Name, and Email are required.");
      return;
    }
    setRegistering(true);
    try {
      const payload = {
        OriginalUsername: editingUsername,
        Username: newUsername,
        Firstname: newFirstName,
        Lastname: newLastName,
        Emailid: newEmail,
        Mobile: newMobile,
        Designation: newDesignation,
        Role: newRole,
        Company: newCompany,
        Associatedwith: newAssociatedWith,
        Status: newStatus || "Active",
        Password: newPassword
      };
      const res = await fetch(`/api/editAdminUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Admin user updated successfully!");
        setEditUserOpen(false);
        setUsers(prev => prev.map(u => u.Username === editingUsername ? { ...u, ...payload } : u));
        setTimeout(() => setSuccessMsg(""), 2500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setModalFeedback(errData.error || "Failed to update admin user.");
      }
    } catch (err) {
      console.error("Edit err:", err);
      setModalFeedback("Network error updating user.");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const username = userToDelete;
    setUserToDelete(null);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/deleteAdminUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username })
      });
      if (res.ok) {
        setSuccessMsg(`User ${username} removed successfully.`);
        setUsers(prev => prev.filter(u => u.Username !== username));
        setTimeout(() => setSuccessMsg(""), 2000);
      } else {
        setErrorMsg("Failed to delete company user.");
      }
    } catch (err) {
      console.error("Delete user err:", err);
      // Mock delete fallback
      setSuccessMsg(`User ${username} removed (Demo mode).`);
      setUsers(prev => prev.filter(u => u.Username !== username));
      setTimeout(() => setSuccessMsg(""), 2000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Dual Tab bar */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold bg-white p-1 rounded-lg border w-fit">
        <button
          onClick={() => {
            setActiveTab("profile");
            setErrorMsg("");
          }}
          className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "profile" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <Building className="h-4 w-4" /> User Profile
        </button>
        <button
          onClick={() => {
            setActiveTab("users");
            setErrorMsg("");
          }}
          className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "users" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <Users className="h-4 w-4" /> Admin Users
        </button>

        <button
          onClick={() => {
            setActiveTab("suppliers");
            setErrorMsg("");
          }}
          className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "suppliers" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <Users className="h-4 w-4" /> Supplier User List
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-bold rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-bold rounded flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
          <span className="text-xxs font-bold uppercase tracking-widest">Loading corporate info...</span>
        </div>
      ) : activeTab === "profile" && company ? (() => {
        const adminUser = users.find(u => u.Username === loggedInUsername) || users[0];

        return (
          <div className="space-y-6">
            {/* <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 space-y-6 shadow-lg">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800">{company.CompanyName}</h3>
                  <p className="text-xxs text-slate-500">Corporate Registered Vendor Profile</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Office Head Location</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {company.OfficeLocation}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Postal Area</span>
                  <span className="text-slate-700 font-semibold">{company.PostalCode}</span>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Registered Address</span>
                  <span className="text-slate-700 font-semibold leading-relaxed">
                    {company.StreetAddress}, {company.City}, {company.State}, {company.Country}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 space-y-5 shadow-lg h-fit">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3">Corporate Contact</h4>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Phone Line</span>
                    <span className="font-semibold text-slate-700">{company.PhoneNumber}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Official Email</span>
                    <span className="font-semibold text-slate-700">{company.EmailId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

            {/* Admin / Logged In User Card */}
            {adminUser && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 space-y-6 shadow-lg">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800">My Profile Details</h3>
                    <p className="text-xxs text-slate-500">Logged-in Administrator Details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Username</span>
                    <span className="text-slate-700 font-semibold">{adminUser.Username}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">First Name</span>
                    <span className="text-slate-700 font-semibold">{adminUser.Firstname || "—"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Last Name</span>
                    <span className="text-slate-700 font-semibold">{adminUser.Lastname || "—"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="text-slate-700 font-semibold">{adminUser.Emailid || "—"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Mobile</span>
                    <span className="text-slate-700 font-semibold">{adminUser.Mobile || "—"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Designation</span>
                    <span className="text-slate-700 font-semibold">{adminUser.Designation || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })() : showAddAdminForm ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg text-slate-800">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800">Add Admin User</h4>
                <p className="text-xxs text-slate-500">Register credentials for a new administrator</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddAdminSubmit} className="p-6 space-y-6">
            {modalFeedback && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Admin Code</label>
                  <input type="text" value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">First Name</label>
                  <input type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Username</label>
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value.replace(/\s/g, ""))} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Email ID *</label>
                  <div className="flex gap-2">
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} disabled={isAdminEmailVerified} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors disabled:opacity-50" required />
                    <button type="button" disabled={isAdminEmailVerified || adminSendingOtp} onClick={handleAdminSendOtp} className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded transition shrink-0 disabled:opacity-50">
                      {adminSendingOtp ? "..." : adminOtpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                  {adminOtpSent && !isAdminEmailVerified && (
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="123456" maxLength={6} value={adminOtpCode} onChange={e => setAdminOtpCode(e.target.value.replace(/\D/g, ""))} className="w-24 bg-white border border-slate-200 text-slate-900 text-center font-bold text-xs py-1.5 px-2 rounded focus:outline-none focus:border-indigo-600 transition" />
                      <button type="button" disabled={adminVerifyingOtp} onClick={handleAdminVerifyOtp} className="px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded transition disabled:opacity-50">
                        {adminVerifyingOtp ? "..." : "Verify"}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Status</label>
                  <input type="text" value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Company</label>
                  <input type="text" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Designation</label>
                  <input type="text" value={newDesignation} onChange={e => setNewDesignation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Last Name</label>
                  <input type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Mobile</label>
                  <input type="text" value={newMobile} onChange={e => setNewMobile(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Role</label>
                  <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Associated With</label>
                  <input type="text" value={newAssociatedWith} onChange={e => setNewAssociatedWith(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-slate-200">
              <button type="button" onClick={() => setShowAddAdminForm(false)} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition shadow-sm bg-white">Back to Admin List</button>
              <button type="submit" disabled={registering} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center min-w-[100px]">
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === "users" ? (

        // Tab 2: Users Registry
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 shadow-lg">

          {/* Controls header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Registered Admin Accounts</h4>
            <button
              onClick={() => setShowAddAdminForm(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xxs rounded transition flex items-center gap-1 shadow cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Admin User
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border border-slate-200 text-slate-800 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Admin User</th>
                  <th className="py-2.5 px-4">Designation</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="block font-bold">{u.Firstname} {u.Lastname}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Username: {u.Username}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{u.Designation}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${u.Role === "Admin"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-50 border border-slate-200 text-slate-500"
                        }`}>
                        {u.Role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="block text-slate-600">{u.Emailid}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Mob: {u.Mobile}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                        {u.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openEditDrawer(u)}
                        className="p-1.5 border border-slate-200 hover:bg-blue-500/10 text-slate-500 hover:text-blue-500 rounded-lg transition shadow-sm bg-white"
                        title="Edit Admin"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setUserToDelete(u.Username)}
                        className="p-1.5 border border-slate-200 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition shadow-sm bg-white"
                        title="Delete Admin"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : activeTab === "suppliers" ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Supplier User List</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border border-slate-200 text-slate-800 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">PAN No</th>
                  <th className="py-2.5 px-4">GST No</th>
                  <th className="py-2.5 px-4">Supplier Code</th>
                  <th className="py-2.5 px-4">Supplier Name</th>
                  <th className="py-2.5 px-4">Email Id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No completed suppliers found.</td>
                  </tr>
                ) : (
                  completedSuppliers.filter(s => String(s.OnboardingCompleted) === "1").map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-bold text-slate-800">{s.PanNo || "—"}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{s.GstNo || "—"}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{s.SupplierCode || "—"}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{s.companyName || s.SupplierName || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">{s.EmailId || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Add User Drawer Flyout */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setAddUserOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl text-slate-800 h-full relative z-10 flex flex-col justify-between shadow-2xl animate-slide-in">

            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-indigo-400" /> Add New Staff User
                </h3>
                <p className="text-xxs text-slate-500 mt-1">Register credentials for company workspace permissions</p>
              </div>
              <button
                onClick={() => setAddUserOpen(false)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-800 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterUser} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

              {modalFeedback && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xxs font-semibold rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalFeedback}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Username *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="staff_amit"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ""))}
                    className="w-full bg-slate-50 border border-slate-200 py-2 pl-8 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                  <KeyRound className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">First Name *</label>
                  <input
                    type="text"
                    placeholder="Amit"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Sen"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Email ID *</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="a.sen@castaliaz.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 pl-8 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                  <Mail className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Designation</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Manager"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2 pl-8 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    />
                    <Briefcase className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Role Permissions</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Supplier">Supplier Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Mobile Phone</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  maxLength={10}
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 mt-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 p-6 bg-slate-50 border-t border-slate-200 flex gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setAddUserOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {registering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  Register Staff
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit User Drawer Flyout */}
      {editUserOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setEditUserOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl text-slate-800 h-full relative z-10 flex flex-col justify-between shadow-2xl animate-slide-in">

            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Edit2 className="h-4 w-4 text-indigo-400" /> Edit Admin User
                </h3>
                <p className="text-xxs text-slate-500 mt-1">Update credentials and details for {editingUsername}</p>
              </div>
              <button
                onClick={() => setEditUserOpen(false)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-800 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

              {modalFeedback && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xxs font-semibold rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Username (Fixed)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newUsername}
                      className="w-full bg-slate-100 border border-slate-200 py-2 pl-8 pr-2.5 rounded text-slate-500 text-xs focus:outline-none cursor-not-allowed"
                      disabled
                    />
                    <KeyRound className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Admin Code (Fixed)</label>
                  <input
                    type="text"
                    value={newAdminCode}
                    className="w-full bg-slate-100 border border-slate-200 py-2 px-2.5 rounded text-slate-500 text-xs focus:outline-none cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Email ID *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2 pl-8 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                      required
                    />
                    <Mail className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Designation</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2 pl-8 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    />
                    <Briefcase className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Role Permissions</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Company</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Associated With</label>
                  <input
                    type="text"
                    value={newAssociatedWith}
                    onChange={(e) => setNewAssociatedWith(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</label>
                  <input
                    type="text"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 p-6 bg-slate-50 border-t border-slate-200 flex gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setEditUserOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {registering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  Update Staff
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div onClick={() => setUserToDelete(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div className="bg-white rounded-xl shadow-2xl relative z-10 w-full max-w-sm overflow-hidden animate-slide-in">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Remove Admin User</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Are you sure you want to remove <strong className="text-slate-700">{userToDelete}</strong>? This action will permanently remove their access.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition shadow-sm bg-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition shadow-sm flex justify-center items-center gap-1.5 text-xs"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
