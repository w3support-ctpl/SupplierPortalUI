import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}

// import Link from "next/link";
// import { ArrowRight, ShoppingCart, Truck, FileText, CheckSquare, ShieldCheck, Mail, HelpCircle, Layers } from "lucide-react";
// 
// export default function LandingPage() {
//   const features = [
//     {
//       icon: <ShoppingCart className="h-6 w-6 text-indigo-500" />,
//       title: "Real-time Purchase Orders",
//       desc: "Instant synchronization with SAP Cloud to view, filter, and print purchase order details."
//     },
//     {
//       icon: <Truck className="h-6 w-6 text-emerald-500" />,
//       title: "Advance Shipping (ASN)",
//       desc: "Draft and post inbound deliveries directly into the system with real-time feedback."
//     },
//     {
//       icon: <FileText className="h-6 w-6 text-sky-500" />,
//       title: "Automated Invoicing",
//       desc: "Track invoice milestones, approval status, and upcoming payment schedules securely."
//     },
//     {
//       icon: <CheckSquare className="h-6 w-6 text-amber-500" />,
//       title: "Incoming RFQs & Bidding",
//       desc: "Receive requests for quotations directly from buyers and submit competitive bids online."
//     }
//   ];
// 
//   const resources = [
//     { label: "About Our Portal", href: "#about" },
//     { label: "Contact Support", href: "#contact" },
//     { label: "Help Center", href: "#help" },
//     { label: "Portal Business Objectives", href: "#objectives" },
//     { label: "Onboarding Checklist", href: "#checklist" },
//     { label: "Purchasing Categories", href: "#categories" },
//     { label: "Usage Terms & Conditions", href: "#terms" }
//   ];
// 
//   return (
//     <div className="flex flex-col min-h-screen bg-slate-50">
//       {/* Glassmorphic Header */}
//       <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-sm">
//         <div className="flex items-center gap-3">
//           <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/20">
//             S
//           </div>
//           <div>
//             <h1 className="font-bold text-lg leading-tight tracking-wide">SUPPLIER PORTAL</h1>
//             <p className="text-xs text-indigo-400 font-semibold tracking-wider">ENTERPRISE EDITION</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//           <Link
//             href="/login"
//             className="text-sm font-medium hover:text-indigo-400 transition"
//           >
//             Sign In
//           </Link>
//           <Link
//             href="/onboarding"
//             className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm hover:shadow-indigo-500/20 transition flex items-center gap-1.5"
//           >
//             New Registration <ArrowRight className="h-4 w-4" />
//           </Link>
//         </div>
//       </header>
// 
//       {/* Main Container */}
//       <main className="flex-1">
//         {/* Hero Section */}
//         <section className="relative overflow-hidden py-20 px-8 bg-slate-900 text-white border-b border-slate-800">
//           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-900 z-0" />
//           
//           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
//             <div className="flex flex-col gap-6 text-center lg:text-left">
//               <span className="inline-flex items-center gap-1.5 self-center lg:self-start px-3 py-1 text-xs bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/25 font-semibold">
//                 <ShieldCheck className="h-3.5 w-3.5" /> SAP Partner Integrated Portal
//               </span>
//               <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
//                 Secure Digital <br />
//                 <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
//                   Supplier Workspace
//                 </span>
//               </h2>
//               <p className="text-lg text-slate-350 max-w-xl leading-relaxed">
//                 Streamline and manage purchase orders, advance shipping notifications (ASN), inbound delivery logs, invoices, and quotations in one centralized platform.
//               </p>
//               
//               <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
//                 <Link
//                   href="/login"
//                   className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 group"
//                 >
//                   Supplier Login <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
//                 </Link>
//                 <Link
//                   href="/onboarding"
//                   className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg transition text-center"
//                 >
//                   Onboarding Registration
//                 </Link>
//               </div>
//             </div>
// 
//             {/* Feature Cards Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {features.map((feat, idx) => (
//                 <div
//                   key={idx}
//                   className="p-6 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col gap-3 hover:-translate-y-1 hover:border-slate-600 transition duration-300"
//                 >
//                   <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700/50">
//                     {feat.icon}
//                   </div>
//                   <h3 className="font-bold text-slate-100">{feat.title}</h3>
//                   <p className="text-sm text-slate-400 leading-normal">{feat.desc}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
// 
//         {/* Resources & Quick Links */}
//         <section className="py-16 px-8 max-w-7xl mx-auto">
//           <div className="text-center mb-12 flex flex-col gap-2">
//             <h3 className="text-2xl font-bold text-slate-855">Quick Reference & Resources</h3>
//             <p className="text-slate-500 max-w-md mx-auto">Explore guidelines, onboarding details, and terms of portal usage.</p>
//           </div>
// 
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {/* Helpful Links Card */}
//             <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
//               <div>
//                 <div className="h-11 w-11 rounded-lg bg-indigo-50 flex items-center justify-center mb-6">
//                   <Layers className="h-5 w-5 text-indigo-600" />
//                 </div>
//                 <h4 className="font-bold text-lg text-slate-900 mb-2">Portal Documents</h4>
//                 <p className="text-slate-500 text-sm mb-6">Access mandatory onboarding checklists, business objectives, and regulatory requirements.</p>
//               </div>
//               <ul className="space-y-3">
//                 {resources.slice(3, 7).map((res, idx) => (
//                   <li key={idx}>
//                     <a href={res.href} className="text-sm font-semibold text-indigo-650 hover:underline flex items-center gap-1.5">
//                       <ArrowRight className="h-3.5 w-3.5 text-slate-400" /> {res.label}
//                     </a>
//                   </li>
//                 ))}
//               </ul>
//             </div>
// 
//             {/* Support Info Card */}
//             <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
//               <div>
//                 <div className="h-11 w-11 rounded-lg bg-emerald-50 flex items-center justify-center mb-6">
//                   <Mail className="h-5 w-5 text-emerald-600" />
//                 </div>
//                 <h4 className="font-bold text-lg text-slate-900 mb-2">Contact & Assistance</h4>
//                 <p className="text-slate-500 text-sm mb-6">Need help with registration, credentials, or SAP sync error troubleshooting?</p>
//               </div>
//               <div className="flex flex-col gap-4">
//                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-1">
//                   <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">E-mail Helpdesk</span>
//                   <a href="mailto:spadmin@castaliaz.in" className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition">
//                     spadmin@castaliaz.in
//                   </a>
//                 </div>
//                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-1">
//                   <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operating Hours</span>
//                   <span className="text-sm font-bold text-slate-800">
//                     Mon - Fri, 09:00 AM - 06:00 PM
//                   </span>
//                 </div>
//               </div>
//             </div>
// 
//             {/* General FAQs Card */}
//             <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
//               <div>
//                 <div className="h-11 w-11 rounded-lg bg-amber-50 flex items-center justify-center mb-6">
//                   <HelpCircle className="h-5 w-5 text-amber-600" />
//                 </div>
//                 <h4 className="font-bold text-lg text-slate-900 mb-2">Portal Objectives</h4>
//                 <p className="text-slate-500 text-sm mb-6">Discover how the portal automates shipping logistics and invoicing to accelerate supplier payments.</p>
//               </div>
//               <ul className="space-y-3">
//                 {resources.slice(0, 3).map((res, idx) => (
//                   <li key={idx}>
//                     <a href={res.href} className="text-sm font-semibold text-indigo-650 hover:underline flex items-center gap-1.5">
//                       <ArrowRight className="h-3.5 w-3.5 text-slate-400" /> {res.label}
//                     </a>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </section>
//       </main>
// 
//       {/* Footer */}
//       <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 px-8">
//         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
//           <div className="flex items-center gap-2">
//             <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
//               S
//             </div>
//             <span className="font-bold text-slate-200 tracking-wide text-sm">SUPPLIER PORTAL</span>
//           </div>
//           <p className="text-xs">&copy; {new Date().getFullYear()} Supplier Portal. All Rights Reserved.</p>
//           <div className="flex gap-4 text-xs">
//             <a href="#privacy" className="hover:text-white transition">Privacy Policy</a>
//             <a href="#terms" className="hover:text-white transition">Terms of Use</a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
