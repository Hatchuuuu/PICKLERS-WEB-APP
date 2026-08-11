"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ZoomIn,
} from "lucide-react";
import type { OwnerApplication } from "@/types/admin";
import { RejectApplicationModal } from "./RejectApplicationModal";
import { useToast } from "@/contexts/ToastContext";

interface ApplicationDetailDrawerProps {
  application: OwnerApplication | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function ApplicationDetailDrawer({
  application,
  onClose,
  onRefresh,
}: ApplicationDetailDrawerProps) {
  const { showToast } = useToast();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedDoc, setZoomedDoc] = useState<string | null>(null);

  if (!application) return null;

  const handleApprove = async () => {
    if (
      !confirm(
        `Are you sure you want to approve "${application.facility_name}"? This will upgrade the user to a Verified Owner.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (res.ok) {
        showToast(
          `Approved "${application.facility_name}"! Owner role activated.`,
          "success"
        );
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to approve application", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Approval failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: reason }),
      });

      if (res.ok) {
        showToast(`Rejected application for "${application.facility_name}".`, "error");
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to reject application", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Rejection failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      showToast("Please enter a note explaining what needs revision.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_revision",
          revision_request_note: revisionNote.trim(),
        }),
      });

      if (res.ok) {
        showToast(`Requested revision from applicant.`, "success");
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to request revision", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to submit request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentPreview = (url?: string, label?: string) => {
    if (!url) {
      return (
        <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
          No {label} uploaded
        </div>
      );
    }

    const isPdf = url.toLowerCase().includes(".pdf");

    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-raised/40">
        <div className="flex items-center justify-between text-xs font-bold text-foreground">
          <span>{label}</span>
          <div className="flex items-center gap-2">
            {!isPdf && (
              <button
                onClick={() => setZoomedDoc(url)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
              >
                <ZoomIn className="w-3.5 h-3.5" /> Zoom
              </button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Link
            </a>
          </div>
        </div>

        {isPdf ? (
          <iframe
            src={url}
            className="w-full h-48 rounded-lg border border-border bg-background"
            title={label}
          />
        ) : (
          <div
            onClick={() => setZoomedDoc(url)}
            className="relative h-40 rounded-lg overflow-hidden border border-border cursor-pointer group bg-black/20"
          >
            <img
              src={url}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
              <ZoomIn className="w-4 h-4" /> Click to Zoom
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Slide-over Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="relative w-full max-w-2xl h-full bg-surface-base border-l border-border shadow-2xl z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-base/80 backdrop-blur-2xl">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Owner Application Inspection
              </div>
              <h2 className="text-xl font-black text-foreground tracking-tight">
                {application.facility_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-raised text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Applicant Profile */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-surface-raised/40">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Applicant Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Business / Owner Name</div>
                  <div className="font-bold text-foreground">{application.business_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Contact Email</div>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-400" /> {application.contact_email}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Contact Phone</div>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> {application.contact_phone}
                  </div>
                </div>
                {application.tax_id_or_reg_no && (
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Tax ID / Reg No</div>
                    <div className="font-semibold text-foreground">{application.tax_id_or_reg_no}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Facility Details */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-surface-raised/40">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Facility Attributes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Facility Address</div>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{application.facility_address}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Court Count</div>
                  <div className="font-bold text-foreground">{application.court_count} court(s)</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Indoor / Outdoor</div>
                  <div className="font-semibold text-foreground">{application.indoor_outdoor || "Indoor"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Surface Type</div>
                  <div className="font-semibold text-foreground">{application.surface_type || "Standard Asphalt"}</div>
                </div>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                Uploaded Documents
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderDocumentPreview(
                  application.business_license_url,
                  "Business Permit / License"
                )}
                {renderDocumentPreview(
                  application.government_id_url,
                  "Proof of Government ID"
                )}
              </div>
            </div>

            {/* Revision note section if requested */}
            {showRevisionInput && (
              <div className="flex flex-col gap-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="text-xs font-bold text-amber-400">
                  Enter Revision Instructions
                </div>
                <textarea
                  rows={3}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Tell applicant what documents or details need correction..."
                  className="w-full p-2.5 rounded-lg border border-amber-500/30 bg-background text-sm text-foreground focus:outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowRevisionInput(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-raised"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400"
                  >
                    Submit Revision Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar Footer */}
          <div className="p-4 border-t border-border bg-surface-base/90 backdrop-blur-2xl flex items-center gap-2">
            <button
              onClick={() => setIsRejectModalOpen(true)}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>

            <button
              onClick={() => setShowRevisionInput(!showRevisionInput)}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Revision Note
            </button>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
          </div>
        </motion.div>
      </div>

      {/* Reject Modal */}
      <RejectApplicationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        facilityName={application.facility_name}
      />

      {/* Document Zoom Modal */}
      {zoomedDoc && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedDoc(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto rounded-2xl">
            <button
              onClick={() => setZoomedDoc(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedDoc} alt="Zoomed document" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
