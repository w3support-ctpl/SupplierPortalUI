"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Building, Globe, CreditCard, FileText, CheckCircle,
  ArrowRight, ArrowLeft, Loader2, Send, Check, ShieldAlert,
  Calendar, UploadCloud, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { Country, State, City } from "country-state-city";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [statusCheckEmail, setStatusCheckEmail] = useState("");
  const [statusCheckPan, setStatusCheckPan] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Step 1: User ID State
  const [panNo, setPanNo] = useState("");
  const [gstnNo, setGstnNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Step 2: Register Company State
  const [companyName, setCompanyName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [step2Districts, setStep2Districts] = useState<any[]>([]);
  const [step2Cities, setStep2Cities] = useState<any[]>([]);
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [headOffice, setHeadOffice] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  // Step 3: Area of Operation State
  const [countriesOp, setCountriesOp] = useState("");
  const [statesOp, setStatesOp] = useState("");
  const [districtsOp, setDistrictsOp] = useState("");
  const [cityOp, setCityOp] = useState("");
  const [dbCountries, setDbCountries] = useState<any[]>([]);
  const [dbStates, setDbStates] = useState<any[]>([]);
  const [dbDistricts, setDbDistricts] = useState<any[]>([]);
  const [dbCities, setDbCities] = useState<any[]>([]);
  const [deliveryModes, setDeliveryModes] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [minLeadTime, setMinLeadTime] = useState("");
  const [preferredPartners, setPreferredPartners] = useState("");

  // Step 4: Payment Preferences State
  const [bankAccounts, setBankAccounts] = useState([
    { bankName: "", accHolderName: "", accountNumber: "", ifscCode: "", swiftCode: "" }
  ]);

  // Step 5: Compliance Docs State (Files & Numbers & Dates)
  const [complianceFiles, setComplianceFiles] = useState<{ [key: string]: File | null }>({});
  const [complianceNumbers, setComplianceNumbers] = useState<{ [key: string]: string }>({});
  const [complianceDates, setComplianceDates] = useState<{ [key: string]: string }>({});

  const handleFileChange = (key: string, file: File | null) => {
    setComplianceFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleNumberChange = (key: string, val: string) => {
    setComplianceNumbers(prev => ({ ...prev, [key]: val }));
  };

  const handleDateChange = (key: string, val: string) => {
    setComplianceDates(prev => ({ ...prev, [key]: val }));
  };

  // Step 6: Registration Status / Confirmation State
  const [regStatus, setRegStatus] = useState<any>(null);

  // Navigation Logic
  const steps = [
    { num: 1, label: "Create User ID", icon: <User className="h-4 w-4" /> },
    { num: 2, label: "Company Details", icon: <Building className="h-4 w-4" /> },
    { num: 3, label: "Area of Operation", icon: <Globe className="h-4 w-4" /> },
    { num: 4, label: "Payment Preferences", icon: <CreditCard className="h-4 w-4" /> },
    { num: 5, label: "Compliance Docs", icon: <FileText className="h-4 w-4" /> },
    { num: 6, label: "Confirmation", icon: <CheckCircle className="h-4 w-4" /> }
  ];

  // OTP Handlers
  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address first.");
      return;
    }
    setErrorMsg("");
    setSendingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerify: email })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSuccessMsg("OTP has been sent to your email.");
      } else {
        setErrorMsg(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setErrorMsg("Error sending OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg("Please enter a 6-digit verification code.");
      return;
    }
    setErrorMsg("");
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerify: email, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setIsEmailVerified(true);
        setSuccessMsg("Email successfully verified!");
      } else {
        setErrorMsg(data.error || data.message || "Invalid OTP entered.");
      }
    } catch (err) {
      setErrorMsg("Error verifying OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const checkApprovalStatus = async (emailToCheck?: string, panToCheck?: string) => {
    const emailVal = emailToCheck || email;
    const panVal = panToCheck || panNo;

    if (!emailVal || !panVal) {
      setErrorMsg("Please enter your registered Email and PAN Number to check status.");
      return;
    }

    setErrorMsg("");
    setCheckingStatus(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/checkOnboardingStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, panNo: panVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.approvalStatus === 1) {
          setUserId(data.userId);
          setIsPendingApproval(false);
          setSuccessMsg("Your account has been approved! You can now proceed.");
          setTimeout(() => {
            setSuccessMsg("");
            setCurrentStep(2);
          }, 1500);
        } else if (data.approvalStatus === 0) {
          setErrorMsg("Your registration is still pending administrator approval.");
          setIsPendingApproval(true);
        } else if (data.approvalStatus === 2) {
          setErrorMsg("Your registration has been rejected by the administrator.");
        }
      } else {
        setErrorMsg(data.error || "No registration found with these details.");
      }
    } catch (err) {
      setErrorMsg("Failed to check status. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get("email");
      const urlPan = params.get("pan");
      const urlUserId = params.get("userId");
      if (urlUserId) {
        setUserId(Number(urlUserId));
      }
      if (urlEmail && urlPan) {
        setEmail(urlEmail);
        setPanNo(urlPan);
        setStatusCheckEmail(urlEmail);
        setStatusCheckPan(urlPan);
        checkApprovalStatus(urlEmail, urlPan);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/getCountryOfOperation", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setDbCountries(data);
        }
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (countriesOp && dbCountries.length > 0) {
      const country = dbCountries.find(c => c.description === countriesOp);
      if (country) {
        fetch("/api/getStates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryId: country.srno })
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setDbStates(data);
            }
          })
          .catch(err => console.error("Error fetching states on load:", err));
      }
    }
  }, [countriesOp, dbCountries]);

  const handleCountryChange = async (countryName: string) => {
    setCountriesOp(countryName);
    setStatesOp(""); // Reset state when country changes

    const country = dbCountries.find(c => c.description === countryName);
    if (!country) {
      setDbStates([]);
      return;
    }

    try {
      const res = await fetch("/api/getStates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryId: country.srno })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDbStates(data);
      } else {
        setDbStates([]);
      }
    } catch (err) {
      console.error("Error fetching states:", err);
      setDbStates([]);
    }
  };

  const handleStateChange = async (stateName: string) => {
    setStatesOp(stateName);
    setDistrictsOp("");
    setCityOp("");

    const stateObj = dbStates.find(s => s.description === stateName);
    if (!stateObj) {
      setDbDistricts([]);
      setDbCities([]);
      return;
    }

    try {
      const res = await fetch("/api/getdistricts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateId: stateObj.srno })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDbDistricts(data);
      } else {
        setDbDistricts([]);
      }
    } catch (err) {
      console.error(err);
      setDbDistricts([]);
    }
  };

  const handleDistrictChange = async (districtName: string) => {
    setDistrictsOp(districtName);
    setCityOp("");

    const districtObj = dbDistricts.find(d => d.description === districtName);
    if (!districtObj) {
      setDbCities([]);
      return;
    }

    try {
      const res = await fetch("/api/getcities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtId: districtObj.srno })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDbCities(data);
      } else {
        setDbCities([]);
      }
    } catch (err) {
      console.error(err);
      setDbCities([]);
    }
  };

  // Submit Step 1
  const submitStep1 = async () => {
    if (loading) return;
    const missing: string[] = [];
    if (!panNo) missing.push("PAN Number");
    if (!gstnNo) missing.push("GSTN Number");
    if (!email) missing.push("Email Address");
    if (!password) missing.push("Password");
    if (!confirmPassword) missing.push("Confirm Password");
    if (missing.length > 0) {
      setErrorMsg(`Required fields missing: ${missing.join(", ")}.`);
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!isEmailVerified) {
      setErrorMsg("Email verification is mandatory.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/createUserNow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          panNo,
          gstnNo,
          password,
          isEmailVerified: 1
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUserId(data.userId);
        setSuccessMsg("User details saved successfully. Your account is now pending administrator approval.");
        setTimeout(() => {
          setSuccessMsg("");
          setIsPendingApproval(true);
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to save user details.");
      }
    } catch (err) {
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2
  const submitStep2 = async () => {
    if (loading) return;
    const missing: string[] = [];
    if (!companyName) missing.push("Company Name");
    if (!streetAddress) missing.push("Street Address");
    if (!postalCode) missing.push("Postal Code");
    if (!country) missing.push("Country");
    if (!headOffice) missing.push("Head Office");
    if (!companyPhone) missing.push("Company Phone");
    if (!companyEmail) missing.push("Company Email");

    if (missing.length > 0) {
      setErrorMsg(`Required fields missing: ${missing.join(", ")}.`);
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/RegiComp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyName,
          streetAddress,
          city,
          district,
          state,
          postalCode,
          country,
          headOffice,
          companyPhone,
          companyEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Company profile registered successfully.");
        setTimeout(() => {
          setSuccessMsg("");
          setCurrentStep(3);
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to save company details.");
      }
    } catch (err) {
      setErrorMsg("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 3
  const submitStep3 = async () => {
    if (loading) return;
    const missing: string[] = [];
    if (!countriesOp) missing.push("Countries of Operation");
    if (!deliveryModes) missing.push("Delivery Modes");
    if (!maxCapacity) missing.push("Max Capacity");
    if (!minLeadTime) missing.push("Min Lead Time");
    if (!preferredPartners) missing.push("Preferred Partners");

    if (missing.length > 0) {
      setErrorMsg(`Required fields missing: ${missing.join(", ")}.`);
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/DeliLoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          countries: countriesOp,
          states: statesOp,
          districts: districtsOp,
          city: cityOp,
          deliveryModes,
          maxCapacity,
          minLeadTime,
          preferredPartners
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Areas of operation saved successfully.");
        setTimeout(() => {
          setSuccessMsg("");
          setCurrentStep(4);
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to save operation details.");
      }
    } catch (err) {
      setErrorMsg("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 4
  const submitStep4 = async () => {
    if (loading) return;
    // Validate
    for (let i = 0; i < bankAccounts.length; i++) {
      const acct = bankAccounts[i];
      const missing: string[] = [];
      if (!acct.bankName) missing.push("Bank Name");
      if (!acct.accHolderName) missing.push("Account Holder Name");
      if (!acct.accountNumber) missing.push("Account Number");
      if (!acct.ifscCode) missing.push("IFSC Code");

      if (missing.length > 0) {
        setErrorMsg(`Bank Account #${i + 1} is missing: ${missing.join(", ")}.`);
        return;
      }
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/PayInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bankAccounts })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save bank details.");
      }

      setSuccessMsg("Payment preferences registered successfully.");
      setTimeout(() => {
        setSuccessMsg("");
        setCurrentStep(5);
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 5
  const submitStep5 = async () => {
    if (loading) return;
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData();
    if (userId) {
      formData.append("userId", String(userId));
    }

    // Append document details
    formData.append("businessRegNo", complianceNumbers.businessReg || "");
    formData.append("businessRegiDate", complianceDates.businessReg || "");
    formData.append("gstCertificateNo", complianceNumbers.gst || "");
    formData.append("gstinCertDate", complianceDates.gst || "");
    formData.append("panCardNo", complianceNumbers.pan || "");
    formData.append("panCardDate", complianceDates.pan || "");
    formData.append("tanCertificateNo", complianceNumbers.tan || "");
    formData.append("tanCertDate", complianceDates.tan || "");
    formData.append("isoCertificateNo", complianceNumbers.iso || "");
    formData.append("isoCertDate", complianceDates.iso || "");
    formData.append("gmpCertificateNo", complianceNumbers.gmp || "");
    formData.append("gmpCertDate", complianceDates.gmp || "");
    formData.append("fdaApprovalNo", complianceNumbers.fda || "");
    formData.append("fdaApprovalDate", complianceDates.fda || "");
    formData.append("bisApprovalNo", complianceNumbers.bis || "");
    formData.append("bisApprovalDate", complianceDates.bis || "");
    formData.append("declAuthenticityNo", complianceNumbers.authenticity || "");
    formData.append("declAuthenticityDate", complianceDates.authenticity || "");
    formData.append("cancelledChequeNo", complianceNumbers.cheque || "");
    formData.append("cancelledChequeDate", complianceDates.cheque || "");
    formData.append("pfRegistrationNo", complianceNumbers.pf || "");
    formData.append("pfRegistrationDate", complianceDates.pf || "");
    formData.append("esicRegistrationNo", complianceNumbers.esic || "");
    formData.append("esicRegistrationDate", complianceDates.esic || "");

    // Append files
    if (complianceFiles.businessReg) formData.append("uploadbusinessRegistration", complianceFiles.businessReg);
    if (complianceFiles.gst) formData.append("uploadGSTINCertificate", complianceFiles.gst);
    if (complianceFiles.pan) formData.append("uploadpanCard", complianceFiles.pan);
    if (complianceFiles.tan) formData.append("uploadtanCard", complianceFiles.tan);
    if (complianceFiles.iso) formData.append("uploadISOCertificate", complianceFiles.iso);
    if (complianceFiles.gmp) formData.append("uploadGMPCertificate", complianceFiles.gmp);
    if (complianceFiles.fda) formData.append("uploadfdaApproval", complianceFiles.fda);
    if (complianceFiles.bis) formData.append("uploadbisApprovalPath", complianceFiles.bis);
    if (complianceFiles.authenticity) formData.append("uploaddeclAuthenticity", complianceFiles.authenticity);
    if (complianceFiles.cheque) formData.append("uploadcancelledCheque", complianceFiles.cheque);
    if (complianceFiles.pf) formData.append("uploadpfRegistration", complianceFiles.pf);
    if (complianceFiles.esic) formData.append("uploadesicRegistration", complianceFiles.esic);

    try {
      const res = await fetch("/api/CompDoc", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Compliance documents submitted!");

        // Fetch Final status values
        const statusRes = await fetch("/api/allRegistrationStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });
        const statusData = await statusRes.json();
        setRegStatus(statusData.value ? statusData.value[0] : null);

        setTimeout(() => {
          setSuccessMsg("");
          setCurrentStep(6);
        }, 1000);
      } else {
        setErrorMsg(data.error || "Failed to submit compliance documents.");
      }
    } catch (err) {
      setErrorMsg("An error occurred during upload. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans relative overflow-hidden">

      {/* Premium Dark Theme Animated Glow Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Top bar */}
      <header className="border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider text-slate-900">SUPPLIER PORTAL</h1>
            <p className="text-[10px] font-bold text-indigo-600">ONBOARDING REGISTER</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          Cancel Registration
        </button>
      </header>

      {/* Main Container - Full Screen Dynamic Layout */}
      <div className="flex-1 flex flex-col lg:h-[calc(100vh-68px)] lg:min-h-0 p-2 sm:p-3 lg:p-4 w-full min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch min-h-0">

          {/* Left Side: Step Tracker (3 cols of grid) */}
          <aside className="lg:col-span-3 flex flex-col gap-6 lg:h-full lg:min-h-0">
            <div className="p-6 card bg-white lg:h-full flex flex-col justify-between animate-fade-in-up">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Steps Tracker</h3>
                <div className="space-y-3 lg:space-y-4 relative">
                  <div className="absolute left-[18px] top-2 bottom-8 w-0.5 bg-slate-200 pointer-events-none" />
                  {steps.map(step => (
                    <div
                      key={step.num}
                      className={`flex items-center gap-3 py-2.5 lg:py-3 relative z-10 transition ${currentStep === step.num
                        ? "text-indigo-600 font-bold"
                        : currentStep > step.num
                          ? "text-emerald-400"
                          : "text-slate-500"
                        }`}
                    >
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center border font-bold text-xs transition ${currentStep === step.num
                        ? "bg-indigo-50 border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/10 shadow-sm"
                        : currentStep > step.num
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-600"
                          : "bg-white border-slate-200/60 text-slate-500"
                        }`}>
                        {currentStep > step.num ? <Check className="h-4 w-4" /> : step.icon}
                      </div>
                      <span className="text-xs">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helpdesk Contacts */}
              <div className="text-[10px] text-slate-500 mt-6 border-t border-slate-200/50 pt-4 leading-normal">
                Need help? Contact our Supplier Support Desk at <span className="font-semibold text-slate-700 block">spadmin@castaliaz.in</span>
              </div>
            </div>
          </aside>

          {/* Right Side: Step Contents (9 cols of grid) */}
          <main className="lg:col-span-9 flex flex-col lg:h-full lg:min-h-0">
            {/* Messages Alert */}
            {errorMsg && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg flex items-start gap-2 animate-fade-in shrink-0">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-400 text-xs font-medium rounded-lg flex items-start gap-2 animate-fade-in shrink-0">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Content Wrapper Card */}
            <div className="flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 sm:p-8 lg:p-10 relative flex flex-col justify-between shadow-sm lg:h-full lg:min-h-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

              {/* ----------------- STEP 1 ----------------- */}
              {currentStep === 1 && (
                isPendingApproval ? (
                  <div className="space-y-6 lg:space-y-8 flex flex-col justify-start flex-1 animate-fade-in-up">
                    <div>
                      <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                        <User className="h-5 w-5 text-indigo-600" /> Registration Pending Approval
                      </h2>
                      <p className="text-slate-500 text-xs lg:text-sm mt-1">Your user details have been saved and sent to the administrator for review.</p>
                    </div>

                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4 text-amber-700">
                      <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                      <div className="text-xs lg:text-sm leading-normal">
                        <p className="font-bold mb-1 text-amber-800">Approval Required</p>
                        <p>Before you can proceed to register your company profile, areas of operation, bank details, and compliance documents, an administrator must approve your User ID request.</p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl flex flex-col gap-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registration Details</div>
                      <div className="grid grid-cols-2 gap-6 text-xs lg:text-sm font-semibold">
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Email Address:</span>
                          <span className="text-slate-900">{email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">PAN Number:</span>
                          <span className="text-slate-900">{panNo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-5 border-t border-slate-200/50 mt-4">
                      <button
                        type="button"
                        disabled={checkingStatus}
                        onClick={() => checkApprovalStatus()}
                        className="btn-primary"
                      >
                        {checkingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Check Approval Status
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPendingApproval(false);
                          setUserId(null);
                        }}
                        className="px-5 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/60 hover:bg-slate-50 text-slate-700 font-bold text-xs lg:text-sm rounded-xl transition cursor-pointer"
                      >
                        Modify Details / Start Over
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 lg:space-y-8 flex-1 flex flex-col justify-start animate-fade-in-up">
                    <div>
                      <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                        <User className="h-5 w-5 text-indigo-600" /> Create User ID
                      </h2>
                      <p className="text-slate-500 text-xs lg:text-sm mt-1">Provide PAN, GSTN, and verify your email to create a supplier account ID.</p>
                    </div>

                    <div className="space-y-5 lg:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">PAN Number *</label>
                          <input
                            type="text"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            value={panNo}
                            onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                            className={`input-field ${panNo && panNo.length !== 10 ? 'border-amber-400 focus:border-amber-500' : ''}`}
                          />
                          <p className="text-[10px] text-slate-400 mt-1">10-character alphanumeric Permanent Account Number.</p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">GSTN Number *</label>
                          <input
                            type="text"
                            placeholder="27ABCDE1234F1Z5"
                            maxLength={15}
                            value={gstnNo}
                            onChange={(e) => setGstnNo(e.target.value.toUpperCase())}
                            className={`input-field ${gstnNo && gstnNo.length !== 15 ? 'border-amber-400 focus:border-amber-500' : ''}`}
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Your 15-digit Goods and Services Tax Identification Number.</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
                        <div className="flex gap-3">
                          <input
                            type="email"
                            placeholder="supplier@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isEmailVerified}
                            className="flex-1 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/60 text-slate-900 text-sm py-2.5 px-4 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 transition-all duration-200"
                          />
                          <button
                            type="button"
                            disabled={isEmailVerified || sendingOtp}
                            onClick={handleSendOtp}
                            className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-500/30 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            {sendingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {otpSent ? "Resend OTP" : "Send OTP"}
                          </button>
                        </div>
                      </div>

                      {otpSent && !isEmailVerified && (
                        <div className="p-5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl space-y-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xxs font-bold text-slate-700 uppercase tracking-widest">Verification Code</span>
                            <p className="text-slate-500 text-xxs lg:text-xs">Enter the 6-digit OTP code sent to your email.</p>
                          </div>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              placeholder="123456"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                              className="w-36 bg-white/80 backdrop-blur-xl border border-slate-200/60 text-slate-900 text-center font-extrabold text-sm tracking-widest py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                            />
                            <button
                              type="button"
                              disabled={verifyingOtp}
                              onClick={handleVerifyOtp}
                              className="px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                            >
                              {verifyingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Submit OTP
                            </button>
                          </div>
                        </div>
                      )}

                      {isEmailVerified && (
                        <div className="py-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-400 font-bold text-xs lg:text-sm">
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> Email Address Verified
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/60 text-slate-900 text-sm py-2.5 pl-4 pr-10 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password *</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/60 text-slate-900 text-sm py-2.5 pl-4 pr-10 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition focus:outline-none"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* ----------------- STEP 2 ----------------- */}
              {currentStep === 2 && (
                <div className="space-y-6 lg:space-y-8 flex-1 flex flex-col justify-start animate-fade-in-up">
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                      <Building className="h-5 w-5 text-indigo-600" /> Register Company Profile
                    </h2>
                    <p className="text-slate-500 text-xs lg:text-sm mt-1">Provide official registration details and head office contact info.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
                    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name *</label>
                      <input
                        type="text"
                        placeholder="Castaliaz Technologies Pvt Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Street Address *</label>
                      <input
                        type="text"
                        placeholder="404, Technopolis Building, Sector V"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Country *</label>
                      <select
                        value={countryCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          setCountryCode(code);
                          const selectedCountry = Country.getCountryByCode(code);
                          setCountry(selectedCountry ? selectedCountry.name : "");
                          setStateCode("");
                          setState("");
                          setCity("");
                        }}
                        className="input-field"
                      >
                        <option value="">Select Country</option>
                        {Country.getAllCountries().filter(c => c.isoCode === 'IN').map((c) => (
                          <option key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">State / Province</label>
                      <select
                        value={stateCode}
                        onChange={async (e) => {
                          const code = e.target.value;
                          setStateCode(code);
                          const selectedState = State.getStateByCodeAndCountry(code, countryCode);
                          const stateName = selectedState ? selectedState.name : "";
                          setState(stateName);
                          setCity("");
                          setDistrict("");
                          setStep2Cities([]);

                          let matchedStateObj = dbStates.find(s => s.description.toLowerCase() === stateName.toLowerCase());

                          if (!matchedStateObj) {
                            let cId = 1;
                            const countryObj = dbCountries.find(c => c.description.toLowerCase() === country.toLowerCase());
                            if (countryObj) cId = countryObj.srno;

                            try {
                              const resStates = await fetch("/api/getStates", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ countryId: cId })
                              });
                              const statesData = await resStates.json();
                              if (resStates.ok && Array.isArray(statesData)) {
                                matchedStateObj = statesData.find(s => s.description.toLowerCase() === stateName.toLowerCase());
                              }
                            } catch (err) { }
                          }

                          if (matchedStateObj) {
                            try {
                              const res = await fetch("/api/getdistricts", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ stateId: matchedStateObj.srno })
                              });
                              const data = await res.json();
                              setStep2Districts(res.ok && Array.isArray(data) ? data : []);
                            } catch (err) {
                              setStep2Districts([]);
                            }
                          } else {
                            setStep2Districts([]);
                          }
                        }}
                        className="input-field"
                        disabled={!countryCode}
                      >
                        <option value="">Select State</option>
                        {countryCode &&
                          State.getStatesOfCountry(countryCode).map((s) => (
                            <option key={s.isoCode} value={s.isoCode}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                    </div>


                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select District</label>
                      <select
                        value={district}
                        onChange={async (e) => {
                          const distName = e.target.value;
                          setDistrict(distName);
                          setCity("");
                          const distObj = step2Districts.find(d => d.description === distName);
                          if (distObj) {
                            try {
                              const res = await fetch("/api/getcities", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ districtId: distObj.srno })
                              });
                              const data = await res.json();
                              setStep2Cities(res.ok && Array.isArray(data) ? data : []);
                            } catch (err) {
                              setStep2Cities([]);
                            }
                          } else {
                            setStep2Cities([]);
                          }
                        }}
                        className="input-field"
                        disabled={!stateCode || step2Districts.length === 0}
                      >
                        <option value="">Select District</option>
                        {step2Districts.map((d) => (
                          <option key={d.srno} value={d.description}>
                            {d.description}
                          </option>
                        ))}
                      </select>
                    </div>


                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input-field cursor-pointer disabled:opacity-50"
                        disabled={!district || step2Cities.length === 0}
                      >
                        <option value="">Select City</option>
                        {step2Cities.map((c) => (
                          <option key={c.srno} value={c.description}>
                            {c.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Postal Code *</label>
                      <input
                        type="text"
                        placeholder="700091"
                        maxLength={6}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-1 lg:col-span-2 xl:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Head Office Location *</label>
                      <input
                        type="text"
                        placeholder="Headquarters Kolkata"
                        value={headOffice}
                        onChange={(e) => setHeadOffice(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-1 lg:col-span-2 xl:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company Phone *</label>
                      <input
                        type="text"
                        placeholder="9876543210"
                        maxLength={10}
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value.replace(/\D/g, ""))}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company Email *</label>
                      <input
                        type="email"
                        placeholder="office@castaliaz.in"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 3 ----------------- */}
              {currentStep === 3 && (
                <div className="space-y-6 lg:space-y-8 flex-1 flex flex-col justify-start animate-fade-in-up">
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                      <Globe className="h-5 w-5 text-indigo-600" /> Areas of Operation
                    </h2>
                    <p className="text-slate-500 text-xs lg:text-sm mt-1">Specify logistical logistics regions, mode of delivery, and partner information.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Countries of Operation *</label>
                      <select
                        value={countriesOp}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Country</option>
                        {dbCountries.filter(c => c.description.toLowerCase() === 'india' || c.description === 'IN').map((c) => (
                          <option key={c.srno} value={c.description}>
                            {c.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">States of Operation</label>
                      <select
                        value={statesOp}
                        onChange={(e) => handleStateChange(e.target.value)}
                        disabled={!countriesOp || dbStates.length === 0}
                        className="input-field disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Select State</option>
                        {dbStates.map((s) => (
                          <option key={s.srno} value={s.description}>
                            {s.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">District of Operation</label>
                      <select
                        value={districtsOp}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        disabled={!statesOp || dbDistricts.length === 0}
                        className="input-field disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Select District</option>
                        {dbDistricts.map((d) => (
                          <option key={d.srno} value={d.description}>
                            {d.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">City of Operation</label>
                      <select
                        value={cityOp}
                        onChange={(e) => setCityOp(e.target.value)}
                        disabled={!districtsOp || dbCities.length === 0}
                        className="input-field disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Select City</option>
                        {dbCities.map((c) => (
                          <option key={c.srno} value={c.description}>
                            {c.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Modes *</label>
                      <input
                        type="text"
                        placeholder="Road, Air, Cargo"
                        value={deliveryModes}
                        onChange={(e) => setDeliveryModes(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Max Delivery Capacity (Monthly) *</label>
                      <input
                        type="text"
                        placeholder="10000 Units"
                        value={maxCapacity}
                        onChange={(e) => setMaxCapacity(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Minimum Lead Time (Days) *</label>
                      <input
                        type="number"
                        placeholder="5"
                        value={minLeadTime}
                        onChange={(e) => setMinLeadTime(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Delivery Partners *</label>
                      <input
                        type="text"
                        placeholder="DHL, FedEx"
                        value={preferredPartners}
                        onChange={(e) => setPreferredPartners(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 4 ----------------- */}
              {currentStep === 4 && (
                <div className="space-y-6 lg:space-y-8 flex-1 flex flex-col justify-start min-h-0 animate-fade-in-up">
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                      <CreditCard className="h-5 w-5 text-indigo-600" /> Payment & Bank Preferences
                    </h2>
                    <p className="text-slate-500 text-xs lg:text-sm mt-1">Specify one or more bank details for direct transfer settlement.</p>
                  </div>

                  <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                    {bankAccounts.map((account, index) => (
                      <div key={index} className="p-6 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl space-y-5 relative">
                        {bankAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setBankAccounts(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-6 right-6 text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline transition"
                          >
                            Remove
                          </button>
                        )}
                        <div className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest">
                          Bank Account Details #{index + 1}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
                          <div className="md:col-span-2 xl:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Name *</label>
                            <input
                              type="text"
                              placeholder="State Bank of India"
                              value={account.bankName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBankAccounts(prev => prev.map((acct, idx) => idx === index ? { ...acct, bankName: val } : acct));
                              }}
                              className="input-field"
                            />
                          </div>
                          <div className="md:col-span-2 xl:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account Holder Name *</label>
                            <input
                              type="text"
                              placeholder="CASTALIAZ TECHNOLOGIES PVT LTD"
                              value={account.accHolderName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBankAccounts(prev => prev.map((acct, idx) => idx === index ? { ...acct, accHolderName: val } : acct));
                              }}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account Number *</label>
                            <input
                              type="text"
                              placeholder="12345678901"
                              value={account.accountNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 40);
                                setBankAccounts(prev => prev.map((acct, idx) => idx === index ? { ...acct, accountNumber: val } : acct));
                              }}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">IFSC Code *</label>
                            <input
                              type="text"
                              placeholder="SBIN0001234"
                              value={account.ifscCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().slice(0, 15);
                                setBankAccounts(prev => prev.map((acct, idx) => idx === index ? { ...acct, ifscCode: val } : acct));
                              }}
                              className="input-field"
                            />
                          </div>
                          <div className="md:col-span-2 xl:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Swift / BIC Code <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                            <input
                              type="text"
                              placeholder="SBININBBXXX"
                              value={account.swiftCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setBankAccounts(prev => prev.map((acct, idx) => idx === index ? { ...acct, swiftCode: val } : acct));
                              }}
                              className="input-field"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Required only for international inward remittances.</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBankAccounts(prev => [...prev, { bankName: "", accHolderName: "", accountNumber: "", ifscCode: "", swiftCode: "" }]);
                    }}
                    className="w-full py-3.5 mt-4 border border-dashed border-slate-300 hover:border-indigo-500 hover:text-indigo-700 rounded-xl text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50/30 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    + Add Another Bank Details
                  </button>
                </div>
              )}

              {/* ----------------- STEP 5 ----------------- */}
              {currentStep === 5 && (
                <div className="space-y-6 lg:space-y-8 flex-1 flex flex-col justify-start min-h-0 animate-fade-in-up">
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                      <FileText className="h-5 w-5 text-indigo-600" /> Compliance Documentation
                    </h2>
                    <p className="text-slate-500 text-xs lg:text-sm mt-1">Upload verified copy of certificates, pan, and registration files.</p>
                  </div>

                  <div className="flex-1 min-h-[300px] overflow-y-auto pr-2 grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6 border-y border-slate-200/50 py-4">
                    {[
                      { key: "businessReg", label: "Business Registration Certificate" },
                      { key: "gst", label: "GSTIN Certificate" },
                      { key: "pan", label: "PAN Card Document" },
                      { key: "tan", label: "TAN Certificate" },
                      { key: "iso", label: "ISO Certificate" },
                      { key: "gmp", label: "GMP Certificate" },
                      { key: "fda", label: "FDA Approval Certificate" },
                      { key: "bis", label: "BIS Approval Certificate" },
                      { key: "authenticity", label: "Declaration of Authenticity" },
                      { key: "cheque", label: "Cancelled Cheque Scan" },
                      { key: "pf", label: "PF Registration Certificate" },
                      { key: "esic", label: "ESIC Registration Certificate" }
                    ].map((doc, idx) => (
                      <div key={idx} className="p-5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md/5 transition duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs lg:text-sm font-extrabold text-slate-900">{doc.label}</span>
                          {complianceFiles[doc.key] && (
                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="h-3 w-3" /> Loaded
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Doc / Reg Number</label>
                            <input
                              type="text"
                              placeholder="Enter Registration No"
                              value={complianceNumbers[doc.key] || ""}
                              maxLength={25}
                              onChange={(e) => handleNumberChange(doc.key, e.target.value.slice(0, 25))}
                              className="w-full bg-white hover:bg-white/80 backdrop-blur-xl border border-slate-200/60 text-slate-900 text-xs py-2 px-3 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issue / Expiry Date</label>
                            <input
                              type="date"
                              value={complianceDates[doc.key] || ""}
                              onChange={(e) => handleDateChange(doc.key, e.target.value)}
                              className="w-full bg-white hover:bg-white/80 backdrop-blur-xl border border-slate-200/60 text-slate-900 text-xs py-2 px-3 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                            />
                          </div>
                        </div>

                        {/* Dropzone */}
                        <div className="border border-dashed border-slate-200/60 hover:border-indigo-500 rounded-xl p-3 text-center transition bg-slate-50 hover:bg-indigo-50/30 relative flex items-center justify-center min-h-[50px] shadow-sm">
                          <input
                            type="file"
                            id={`file-${doc.key}`}
                            onChange={(e) => handleFileChange(doc.key, e.target.files ? e.target.files[0] : null)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex items-center justify-center gap-2 text-xxs text-slate-500">
                            <UploadCloud className="h-4 w-4 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                              {complianceFiles[doc.key]
                                ? complianceFiles[doc.key]!.name
                                : "Click to upload file (PDF, PNG, JPG)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------- STEP 6 ----------------- */}
              {currentStep === 6 && (
                <div className="space-y-6 lg:space-y-8 flex flex-col justify-start flex-1 animate-fade-in-up">
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                      <CheckCircle className="h-5 w-5 text-emerald-400" /> Under Verification Review
                    </h2>
                    <p className="text-slate-500 text-xs lg:text-sm mt-1">Your onboarding application is successfully registered. The checklist below shows your registration metrics status.</p>
                  </div>

                  {/* Status List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 my-2">
                    {[
                      { label: "Credentials Configured", ok: true },
                      { label: "Company Register Form", ok: true },
                      { label: "Email OTP Verified", ok: true },
                      { label: "Area of Operation Saved", ok: true },
                      { label: "Bank Preference Details", ok: true },
                      { label: "Compliance Files Uploaded", ok: true }
                    ].map((stat, idx) => (
                      <div key={idx} className="p-4.5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl flex items-center justify-between shadow-sm">
                        <span className="text-xs lg:text-sm text-slate-800 font-extrabold">{stat.label}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${stat.ok
                          ? "bg-emerald-50 text-emerald-400 border border-emerald-200/50"
                          : "bg-amber-50 text-amber-700 border border-amber-300/50"
                          }`}>
                          {stat.ok ? "Completed" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl flex gap-4 text-indigo-700">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-indigo-600" />
                    <div className="text-xs lg:text-sm leading-normal">
                      <p className="font-extrabold mb-1 text-indigo-800">Onboarding Process Completed</p>
                      <p>Our administrative desk will audit your uploaded documents and GSTN information against government records. You will receive an activation link via your registered email shortly.</p>
                    </div>
                  </div>

                  <div className="text-center pt-5 border-t border-slate-200/50 mt-4">
                    <button
                      onClick={() => router.push("/login")}
                      className="btn-primary"
                    >
                      Go to Sign In Panel
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Buttons */}
              {currentStep < 6 && !(currentStep === 1 && isPendingApproval) && (
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-5 mt-6">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setErrorMsg("");
                        setCurrentStep(prev => prev - 1);
                      }}
                      className="btn-secondary border-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Previous Step
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (currentStep === 1) submitStep1();
                      else if (currentStep === 2) submitStep2();
                      else if (currentStep === 3) submitStep3();
                      else if (currentStep === 4) submitStep4();
                      else if (currentStep === 5) submitStep5();
                    }}
                    className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:translate-y-px text-white font-bold text-xs rounded-lg transition shadow-md shadow-indigo-600/20 flex items-center gap-1 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        {currentStep === 1 && "Verify Identity & Continue"}
                        {currentStep === 2 && "Save Company Profile & Next"}
                        {currentStep === 3 && "Confirm Operations & Next"}
                        {currentStep === 4 && "Save Preferences & Next"}
                        {currentStep === 5 && "Submit Documentation"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            <footer className="text-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider pt-2 shrink-0">
              © Powered by Castaliaz Technologies
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
