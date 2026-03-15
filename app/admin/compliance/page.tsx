"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  Search,
  Download,
  Loader2,
  ChevronLeft,
  User,
  Calendar,
  FileText,
  Camera,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface ComplianceRecord {
  id: number;
  creator_id: string;
  legal_name: string;
  date_of_birth: string;
  document_type: string;
  document_url: string;
  selfie_url: string;
  verified_at: string;
  verified_by: string | null;
  is_active: boolean;
  created_at: string;
  display_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  admin_display_name: string | null;
}

export default function AdminCompliancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchRecords = useCallback(async (search: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/compliance?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data ?? []);
      } else {
        setErrorMessage("Failed to load compliance records.");
      }
    } catch {
      setErrorMessage("Failed to load compliance records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(searchQuery);
  }, [searchQuery, fetchRecords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("format", "csv");
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/compliance?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `2257-compliance-records-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setErrorMessage("Failed to export CSV.");
      }
    } catch {
      setErrorMessage("Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDocType = (type: string) => {
    const labels: Record<string, string> = {
      passport: "Passport",
      drivers_license: "Driver's License",
      national_id: "National ID",
      other: "Other",
    };
    return labels[type] || type;
  };

  // Detail view
  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedRecord(null);
            setErrorMessage(null);
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Compliance Record #{selectedRecord.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            18 U.S.C. 2257 record details for {selectedRecord.legal_name}
          </p>
        </div>

        {/* Creator info */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00AFF0] text-lg font-bold text-white overflow-hidden">
                {selectedRecord.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedRecord.display_name}</h2>
                <p className="text-sm text-muted-foreground">
                  @{selectedRecord.username} &middot; {selectedRecord.email}
                </p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  {selectedRecord.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Legal Name</p>
                  <p className="text-sm font-medium text-foreground">{selectedRecord.legal_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(selectedRecord.date_of_birth + "T00:00:00")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Document Type</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDocType(selectedRecord.document_type)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Verified At</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateTime(selectedRecord.verified_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Verified By</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedRecord.admin_display_name || selectedRecord.verified_by || "System"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <FileText className="h-4 w-4 text-[#00AFF0]" />
                Government ID
              </h3>
              <a
                href={selectedRecord.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200 hover:border-[#00AFF0]/50 transition-colors"
              >
                <img
                  src={selectedRecord.document_url}
                  alt="Government ID"
                  className="w-full h-auto"
                />
              </a>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardContent className="p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Camera className="h-4 w-4 text-[#00AFF0]" />
                Selfie with ID
              </h3>
              <a
                href={selectedRecord.selfie_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200 hover:border-[#00AFF0]/50 transition-colors"
              >
                <img
                  src={selectedRecord.selfie_url}
                  alt="Selfie with ID"
                  className="w-full h-auto"
                />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            2257 Compliance Records
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            18 U.S.C. 2257 record retention — {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          className="border-gray-200 gap-2"
          onClick={handleExportCSV}
          disabled={exporting || records.length === 0}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none"
          />
        </div>
        <Button type="submit" className="bg-[#00AFF0] hover:bg-[#0099D0] text-white">
          Search
        </Button>
      </form>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No compliance records</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "No records match your search criteria."
                : "Compliance records are created automatically when creators are verified."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creator</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Legal Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">DOB</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Doc Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Verified</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white shrink-0">
                          {record.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{record.display_name}</p>
                          <p className="text-xs text-muted-foreground">@{record.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{record.legal_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {record.date_of_birth}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDocType(record.document_type)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(record.verified_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        record.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <ShieldCheck className="h-3 w-3" />
                        {record.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
