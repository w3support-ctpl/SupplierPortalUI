"use client";

import { useState } from "react";
import { AlertCircle, Inbox, Send, Search, Filter, ArrowUpDown, Mail, CheckCircle2 } from "lucide-react";

interface MessageItem {
  id: string;
  subject: string;
  sender: string;
  category: string;
  date: string;
  body: string;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("Inbox");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const inboxMessages: MessageItem[] = [
    {
      id: "1",
      subject: "New PO Update",
      sender: "Procurement",
      category: "Notification",
      date: "2025-01-22 10:30 AM",
      body: "This is the first message."
    },
    {
      id: "2",
      subject: "System Update",
      sender: "Admin",
      category: "Announcement",
      date: "2025-01-20 2:15 PM",
      body: "The system will undergo maintenance this weekend."
    }
  ];

  const sentMessages: MessageItem[] = [
    {
      id: "3",
      subject: "Invoice #1029 Query",
      sender: "Me",
      category: "Finance",
      date: "2025-01-19 09:15 AM",
      body: "Can you confirm if invoice 1029 has been processed?"
    }
  ];

  const messages = activeTab === "Inbox" ? inboxMessages : sentMessages;
  const selectedMessage = messages.find(m => m.id === selectedMessageId);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)] min-h-[650px]">
      
      {/* Warning Banner */}
      <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs shadow-sm shrink-0">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold text-amber-950">Notice:</span> This is a sample page. We need more details to make it fully functional.
        </div>
      </div>

      <div className="flex-1 border border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-5 flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">Mailbox</h3>
            <button 
              onClick={() => {
                setActiveTab("Inbox");
                setSelectedMessageId(null);
              }}
              className={`py-2.5 px-4 text-sm font-bold flex items-center gap-3 rounded-xl transition ${
                activeTab === "Inbox" 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-600 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <Inbox className={`h-4 w-4 ${activeTab === "Inbox" ? "text-indigo-600" : "text-slate-400"}`} />
              Inbox
              {activeTab === "Inbox" && <span className="ml-auto bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">2</span>}
            </button>
            <button 
              onClick={() => {
                setActiveTab("Sent Items");
                setSelectedMessageId(null);
              }}
              className={`py-2.5 px-4 text-sm font-bold flex items-center gap-3 rounded-xl transition ${
                activeTab === "Sent Items" 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-600 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <Send className={`h-4 w-4 ${activeTab === "Sent Items" ? "text-indigo-600" : "text-slate-400"}`} />
              Sent Items
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
          
          {/* Top Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search messages..." 
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs py-2.5 pl-9 pr-4 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all w-64"
                />
              </div>
              <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs hover:bg-indigo-700 transition shadow-sm font-bold active:translate-y-px">
                Search
              </button>
            </div>

            {/* Filters & Sort */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer transition">
                  <option>All Messages</option>
                  <option>Unread Only</option>
                  <option>Important</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <select className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer transition">
                  <option>Sort by Date</option>
                  <option>Sort by Sender</option>
                  <option>Sort by Subject</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic View Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 flex flex-col gap-6">
            
            {/* Message List */}
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                {activeTab === "Inbox" ? <Inbox className="h-5 w-5 text-indigo-600" /> : <Send className="h-5 w-5 text-indigo-600" />}
                {activeTab}
              </h2>
              
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {messages.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                    <Mail className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No messages available.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {messages.map(msg => (
                      <div 
                        key={msg.id} 
                        onClick={() => setSelectedMessageId(msg.id)}
                        className={`p-4 cursor-pointer transition flex flex-col gap-1 border-l-4 ${
                          selectedMessageId === msg.id 
                            ? "bg-indigo-50/50 border-l-indigo-600" 
                            : "bg-white hover:bg-slate-50 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className={`text-[13px] ${selectedMessageId === msg.id ? "font-extrabold text-indigo-900" : "font-bold text-slate-800"}`}>
                            {msg.subject}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-400">{msg.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="text-slate-700">{msg.sender}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{msg.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details / Reply Area */}
            <div>
              {selectedMessage ? (
                <div className="animate-fade-in space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Detail Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-extrabold text-slate-900 text-lg mb-2">{selectedMessage.subject}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {selectedMessage.sender.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold">{selectedMessage.sender}</span>
                          <span>{selectedMessage.category} • {selectedMessage.date}</span>
                        </div>
                      </div>
                    </div>
                    {/* Detail Body */}
                    <div className="p-5 text-[13px] text-slate-700 leading-relaxed min-h-[80px]">
                      {selectedMessage.body}
                    </div>
                  </div>
                  
                  {/* Reply Box */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                    <textarea 
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 text-[13px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 min-h-[120px] mb-4 resize-y transition-all"
                      placeholder="Write your reply here..."
                    ></textarea>
                    <div className="flex justify-end">
                      <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs hover:bg-indigo-700 transition font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 active:translate-y-px">
                        <Send className="h-3.5 w-3.5" /> Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in h-full">
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-base mb-1">No Message Selected</h3>
                    <p className="text-xs text-slate-500 max-w-xs">Select a message from your list above to read the details and compose a reply.</p>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
