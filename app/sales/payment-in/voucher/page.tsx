// Payment Voucher Page for Sales > Payment-In

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";

const PaymentVoucher = () => {
  return (
    <DashboardLayout>
      {/* Header Section */}
<div className="bg-white px-6 py-8 border-b border-gray-200">
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
    
    {/* Left Side */}
    <div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide uppercase text-black">
        PAYMENT VOUCHER
      </h1>

      <p className="text-gray-500 mt-3 text-sm md:text-lg">
        Record incoming payments for financial control and institutional
        compliance.
      </p>
    </div>

    {/* Right Side */}
    <div className="md:text-right">
      <p className="text-gray-400 text-sm font-semibold uppercase">
        Voucher ID
      </p>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-700">
        #PMT-8821
      </h2>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-100 min-h-screen">
        
        {/* Financial Control Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 w-full lg:w-[350px] h-fit">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm">
              ✓
            </span>
            Financial Control
          </h2>

          <p className="text-gray-600 text-sm leading-6 mb-5">
            Efficiently record incoming payments. Ensure all mandatory fields
            marked with an asterisk are filled for institutional compliance.
          </p>

          {/* Requirement Checklist */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <h3 className="font-semibold text-xs tracking-wide text-gray-700 mb-3">
              REQUIREMENT CHECKLIST
            </h3>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-green-600">
                <span>●</span>
                Customer Identity Verified
              </li>

              <li className="flex items-center gap-2 text-green-600">
                <span>●</span>
                Receipt Sequencing Active
              </li>

              <li className="flex items-center gap-2 text-gray-400">
                <span>●</span>
                Taxation Field (Optional)
              </li>
            </ul>
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex-1">
          <h3 className="text-lg font-semibold mb-6">Entry Form</h3>

          <form className="space-y-5">
            
            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                CUSTOMER NAME / PHONE *
              </label>

              <input
                type="text"
                placeholder="Search customer by name or mobile..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            {/* Date + Receipt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                  PAYMENT DATE *
                </label>

                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                  RECEIPT NUMBER
                </label>

                <input
                  type="text"
                  placeholder="e.g. REC-10293"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                PAYMENT TYPE *
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-black text-white text-sm font-medium"
                >
                  CASH
                </button>

                <button
                  type="button"
                  className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium"
                >
                  BANK
                </button>

                <button
                  type="button"
                  className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium"
                >
                  UPI
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                RECEIVED AMOUNT (INR) *
              </label>

              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
                <span className="text-gray-500 text-lg mr-2">₹</span>

                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  className="flex-1 outline-none text-lg font-semibold"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                DESCRIPTION / NOTES
              </label>

              <textarea
                rows={4}
                placeholder="Add payment notes, reference details..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                ATTACHMENTS
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-black transition">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <span className="text-3xl mb-3">📤</span>

                  <p className="font-medium text-sm">
                    Upload file or drag and drop
                  </p>

                  <p className="text-xs mt-2">
                    PDF, PNG, JPG (MAX 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl font-semibold transition"
            >
              SAVE TRANSACTION
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentVoucher;