"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText } from "lucide-react";

const SSN_PATTERN = /^\d{3}-\d{2}-\d{4}$/;
const EIN_PATTERN = /^\d{2}-\d{7}$/;

interface TaxInfoFormProps {
  isCreator: boolean;
}

export default function TaxInfoForm({ isCreator }: TaxInfoFormProps) {
  const [legalName, setLegalName] = useState("");
  const [businessType, setBusinessType] = useState("individual");
  const [taxId, setTaxId] = useState("");
  const [taxIdLast4, setTaxIdLast4] = useState<string | null>(null);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("US");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadedBusinessType, setLoadedBusinessType] = useState("individual");

  // Load tax info on mount
  useEffect(() => {
    if (!isCreator) return;

    async function fetchTaxInfo() {
      try {
        const res = await fetch("/api/tax-info");
        if (!res.ok) return;
        const json = await res.json();
        if (json.data) {
          setLegalName(json.data.legal_name ?? "");
          setBusinessType(json.data.business_type ?? "individual");
          setLoadedBusinessType(json.data.business_type ?? "individual");
          setTaxIdLast4(json.data.tax_id_last4 ?? null);
          setAddressLine1(json.data.address_line1 ?? "");
          setAddressLine2(json.data.address_line2 ?? "");
          setCity(json.data.city ?? "");
          setState(json.data.state ?? "");
          setZipCode(json.data.zip_code ?? "");
          setCountry(json.data.country ?? "US");
          setLoaded(true);
        }
      } catch {
        // non-critical
      }
    }
    fetchTaxInfo();
  }, [isCreator]);

  // Tax ID format validation (MEDIUM-2)
  const taxIdValidationError = useMemo(() => {
    if (!taxId || taxIdLast4) return null;
    const isValidSSN = SSN_PATTERN.test(taxId);
    const isValidEIN = EIN_PATTERN.test(taxId);
    if (!isValidSSN && !isValidEIN) {
      return "Invalid format. Use SSN (XXX-XX-XXXX) or EIN (XX-XXXXXXX).";
    }
    return null;
  }, [taxId, taxIdLast4]);

  const isTaxIdFormatValid = taxIdValidationError === null;

  // Masked display for existing tax ID (MEDIUM-3)
  const maskedTaxId = useMemo(() => {
    if (!taxIdLast4) return null;
    if (loadedBusinessType === "individual") {
      return `\u2022\u2022\u2022-\u2022\u2022-${taxIdLast4}`;
    }
    return `\u2022\u2022-\u2022\u2022\u2022${taxIdLast4}`;
  }, [taxIdLast4, loadedBusinessType]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/tax-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: legalName,
          business_type: businessType,
          tax_id: taxId,
          address_line1: addressLine1,
          address_line2: addressLine2 || undefined,
          city,
          state,
          zip_code: zipCode,
          country,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSaveMessage("Tax information saved successfully.");
        setTaxIdLast4(json.data?.tax_id_last4 ?? null);
        setLoadedBusinessType(businessType);
        setTaxId(""); // Clear raw tax ID from state
        setLoaded(true);
      } else {
        setSaveError(json.error ?? "Failed to save tax information.");
      }
    } catch {
      setSaveError("Failed to save tax information.");
    } finally {
      setSaving(false);
    }
  };

  if (!isCreator) return null;

  const isFormComplete =
    legalName.trim() &&
    addressLine1.trim() &&
    city.trim() &&
    state.trim() &&
    zipCode.trim() &&
    (taxId || taxIdLast4);

  const isSaveDisabled =
    saving || !isFormComplete || (taxId && !isTaxIdFormatValid);

  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="h-5 w-5 text-[#00AFF0]" />
          <h2 className="text-lg font-semibold text-foreground">Tax Information</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          W-9 equivalent for 1099 reporting. Required for US-based creators.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-5">
          Required for creators earning $600+ per year. Your tax ID is encrypted and never stored in plaintext.
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {saveError}
          </div>
        )}

        {saveMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {saveMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Legal Name */}
          <div>
            <Label htmlFor="taxLegalName" className="text-sm text-muted-foreground">
              Legal Name
            </Label>
            <Input
              id="taxLegalName"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Full legal name as it appears on your tax return"
              maxLength={255}
              className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
            />
          </div>

          {/* Business Type */}
          <div>
            <Label htmlFor="taxBusinessType" className="text-sm text-muted-foreground">
              Business Type
            </Label>
            <select
              id="taxBusinessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none"
            >
              <option value="individual">Individual</option>
              <option value="sole_proprietor">Sole Proprietor</option>
              <option value="llc">LLC</option>
              <option value="corporation">Corporation</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>

          {/* Tax ID (SSN/EIN) */}
          <div>
            <Label htmlFor="taxId" className="text-sm text-muted-foreground">
              Tax ID (SSN or EIN)
            </Label>
            {taxIdLast4 && !taxId ? (
              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-muted-foreground font-mono tracking-wider">
                  {maskedTaxId}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-gray-200 shrink-0"
                  onClick={() => setTaxIdLast4(null)}
                >
                  Update
                </Button>
              </div>
            ) : (
              <>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="XXX-XX-XXXX or XX-XXXXXXX"
                  maxLength={11}
                  autoComplete="off"
                  className={`mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30 font-mono ${
                    taxId && taxIdValidationError ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""
                  }`}
                />
                {taxId && taxIdValidationError && (
                  <p className="text-xs text-red-500 mt-1">{taxIdValidationError}</p>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              SSN format: XXX-XX-XXXX | EIN format: XX-XXXXXXX
            </p>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="taxAddressLine1" className="text-sm text-muted-foreground">
              Address Line 1
            </Label>
            <Input
              id="taxAddressLine1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street address"
              maxLength={255}
              className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
            />
          </div>

          <div>
            <Label htmlFor="taxAddressLine2" className="text-sm text-muted-foreground">
              Address Line 2 <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="taxAddressLine2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apt, suite, unit, etc."
              maxLength={255}
              className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="taxCity" className="text-sm text-muted-foreground">
                City
              </Label>
              <Input
                id="taxCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                maxLength={100}
                className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
              />
            </div>
            <div>
              <Label htmlFor="taxState" className="text-sm text-muted-foreground">
                State
              </Label>
              <Input
                id="taxState"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30 uppercase"
              />
            </div>
            <div>
              <Label htmlFor="taxZipCode" className="text-sm text-muted-foreground">
                ZIP Code
              </Label>
              <Input
                id="taxZipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="90210"
                maxLength={10}
                className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-[#00AFF0] hover:bg-[#009dd8]"
              onClick={handleSave}
              disabled={!!isSaveDisabled}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : loaded ? (
                "Update Tax Info"
              ) : (
                "Save Tax Info"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
