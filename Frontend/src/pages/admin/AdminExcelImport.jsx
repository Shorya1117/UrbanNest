import { useState } from "react";
import {
  Download, Upload, CheckCircle, XCircle,
  FileSpreadsheet, AlertTriangle, Users, Home,
} from "lucide-react";
import toast from "react-hot-toast";
import { excelAPI } from "../../api/services";
import { PageLayout, PageHeader } from "../../components/layout";
import { Button, Spinner } from "../../components/ui";

const TEMPLATE_COLUMNS = [
  { col: "Block Number", desc: "e.g. A, B, C", required: true },
  { col: "Flat Number",  desc: "e.g. 101, 202", required: true },
  { col: "Ownership Type", desc: "OWNER or TENANT", required: true },
  { col: "Head Name",   desc: "Full name of flat owner/head", required: true },
  { col: "Head Email",  desc: "Unique email for OTP login", required: true },
  { col: "Head Phone",  desc: "10-digit mobile number", required: true },
  { col: "Member 1 Name",  desc: "Family member name", required: false },
  { col: "Member 1 Email", desc: "Family member email", required: false },
  { col: "Member 1 Phone", desc: "Family member phone", required: false },
  { col: "Member 2 Name",  desc: "Repeat for up to 5 members", required: false },
  { col: "Member 2 Email", desc: "", required: false },
  { col: "Member 2 Phone", desc: "", required: false },
];

export default function AdminExcelImport() {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState("upload"); // upload | preview | done
  const [dragging, setDragging]   = useState(false);

  // ── Download template ──────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const res = await excelAPI.downloadTemplate();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "urbannest_residents_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded!");
    } catch {
      toast.error("Failed to download template.");
    }
  };

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowed.includes(f.type)) {
      toast.error("Only .xlsx or .xls files are allowed.");
      return;
    }
    setFile(f);
    setPreview(null);
    setResults(null);
    setStep("upload");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Preview ────────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!file) return toast.error("Please select a file first.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await excelAPI.preview(fd);
      setPreview(res.data.data);
      setStep("preview");
      toast.success(`Found ${res.data.data.totalRows} rows. Review before importing.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await excelAPI.import(fd);
      setResults(res.data.data.results);
      setStep("done");
      toast.success("Import completed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setStep("upload");
  };

  return (
    <PageLayout>
      <PageHeader
        title="Bulk Resident Import"
        description="Upload an Excel file to import all residents at once"
        action={
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            <Download size={15} /> Download Template
          </Button>
        }
      />

      {/* Column guide */}
      <div className="card mb-6 border border-blue-100 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="text-secondary" size={20} />
          <h2 className="font-extrabold text-gray-900">Excel Format Guide</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-blue-100">
                <th className="text-left py-2 pr-4 font-bold text-gray-700">Column</th>
                <th className="text-left py-2 pr-4 font-bold text-gray-700">Description</th>
                <th className="text-left py-2 font-bold text-gray-700">Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {TEMPLATE_COLUMNS.map((col) => (
                <tr key={col.col}>
                  <td className="py-1.5 pr-4 font-mono font-semibold text-gray-800">{col.col}</td>
                  <td className="py-1.5 pr-4 text-gray-500">{col.desc}</td>
                  <td className="py-1.5">
                    {col.required
                      ? <span className="text-red-500 font-bold">Required</span>
                      : <span className="text-gray-400">Optional</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3 bg-white/60 rounded-xl p-3 border border-blue-100">
          💡 <strong>How residents log in:</strong> Each resident uses their <strong>email address</strong> to receive an OTP.
          Make sure every email is correct and unique. The HEAD user is the primary account holder for the flat.
        </p>
      </div>

      {/* Upload area */}
      {step === "upload" && (
        <div className="card">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("excelInput").click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              dragging || file
                ? "border-primary bg-primary-50"
                : "border-gray-200 hover:border-primary hover:bg-primary-50/30"
            }`}
          >
            <FileSpreadsheet
              className={`w-14 h-14 mx-auto mb-4 ${file ? "text-primary" : "text-gray-300"}`}
            />
            {file ? (
              <>
                <p className="text-base font-extrabold text-gray-900 mb-1">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB · Click to change file
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-extrabold text-gray-700 mb-1">
                  Drag & drop your Excel file here
                </p>
                <p className="text-sm text-gray-400">or click to browse · .xlsx / .xls only</p>
              </>
            )}
            <input
              id="excelInput"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <div className="flex gap-3 mt-5">
              <Button variant="ghost" onClick={reset} className="flex-1">Clear</Button>
              <Button onClick={handlePreview} loading={loading} className="flex-1">
                <FileSpreadsheet size={15} /> Preview Data
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Preview table */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Users className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-extrabold text-gray-900">Preview — First 10 rows</p>
                <p className="text-xs text-gray-500">{preview.totalRows} total rows in file</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset}>Back</Button>
              <Button onClick={handleImport} loading={loading}>
                <Upload size={15} /> Import All {preview.totalRows} Rows
              </Button>
            </div>
          </div>

          <div className="card p-0 overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Row", "Flat", "Ownership", "HEAD", "Members"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.preview.map((row) => (
                    <tr key={row.row} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{row.row}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">{row.block}-{row.flat}</span>
                        <br />
                        <span className="text-xs text-gray-400">{row.ownershipType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          row.ownershipType === "TENANT"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {row.ownershipType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{row.head?.name}</p>
                        <p className="text-xs text-gray-500">{row.head?.email}</p>
                        <p className="text-xs text-gray-400">{row.head?.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        {row.members?.length === 0 ? (
                          <span className="text-xs text-gray-400">No members</span>
                        ) : (
                          <div className="space-y-1">
                            {row.members.map((m, i) => (
                              <div key={i} className="text-xs">
                                <span className="font-medium text-gray-700">{m.name}</span>
                                <span className="text-gray-400 ml-1">· {m.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {preview.totalRows > 10 && (
            <p className="text-xs text-gray-400 text-center">
              Showing first 10 rows. All {preview.totalRows} rows will be imported.
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {step === "done" && results && (
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Import Complete!</h2>
              <p className="text-sm text-gray-500">Here's a summary of what was processed.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Users Created", value: results.created, color: "text-primary", bg: "bg-primary-50" },
              { label: "Flats Created", value: results.flats,   color: "text-secondary", bg: "bg-blue-50" },
              { label: "Skipped (exists)", value: results.skipped, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Errors",        value: results.errors?.length || 0, color: "text-red-500", bg: "bg-red-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">{label}</p>
              </div>
            ))}
          </div>

          {results.errors?.length > 0 && (
            <div className="border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-sm font-bold text-red-600">Rows with errors (skipped)</p>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <XCircle size={12} className="text-red-400 shrink-0" />
                    <span>Row {e.row}: {e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={reset} className="flex-1">
              Import Another File
            </Button>
            <Button onClick={() => window.location.href = "/admin/residents"} className="flex-1">
              <Users size={15} /> View Residents
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
