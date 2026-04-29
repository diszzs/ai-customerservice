"use client";

import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0 4v2M9 3h6m0 0a9 9 0 019 9v6a9 9 0 01-9 9H9a9 9 0 01-9-9v-6a9 9 0 019-9z"
                />
              </svg>
            </div>

            <h1 className="text-center text-xl font-bold text-slate-900 mb-2">
              Oops! Terjadi Kesalahan
            </h1>
            <p className="text-center text-sm text-slate-600 mb-6">
              Aplikasi mengalami error yang tidak terduga. Silakan refresh
              halaman atau kembali ke beranda.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 rounded-lg bg-slate-100 border border-slate-300">
                <p className="text-xs font-mono text-slate-700 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Refresh
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
