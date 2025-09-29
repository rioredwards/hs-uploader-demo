import { useCallback, useMemo, useRef, useState } from "react";
import "./upload.css";

export type UploadWidgetProps = {
  uploadUrl: string;
  token: string;
  claimName: string;
  claimId: string;
  fullName: string;
  userId: string;
  categories?: string[];
  maxFileSizeBytes?: number;
};

const DEFAULT_MAX = 250 * 1024 * 1024; // 250MB

const DEFAULT_CATEGORIES = [
  "Award",
  "Certifications and Authorizations",
  "Compensation",
  "Compensation Collateral Offsets",
  "Compensation Deceased Claim",
  "Compensation Dependents",
  "Compensation Disability Paperwork",
  "Compensation Funeral Burial Expenses",
  "Compensation Lost Earnings",
  "Compensation Medical Expenses",
  "Compensation Replacement Services",
  "Compensation Spouse",
  "Correspondence",
  "Death Records",
  "Drafts",
  "Estate",
  "Estate Administration Probate",
  "Estate Administration Probate E-Filed",
  "Estate Wrongful Death Complaint",
  "Estate Wrongful Death Complaint E-Filed",
  "Estate Wrongful Death Complaint E-Filed Exhibits",
  "Full File Scan",
  "Intake and Retainer",
  "Medical Records",
  "Medical Records WTCHP",
  "New Custom Folder",
  "Proof",
  "Proof Drafts",
  "Proof Final Proof",
  "Signed Contracts",
  "Tasks",
  "VCF Upload Docs",
];

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function UploadWidget(props: UploadWidgetProps) {
  const {
    uploadUrl,
    token,
    claimName,
    claimId,
    fullName,
    userId,
    categories = DEFAULT_CATEGORIES,
    maxFileSizeBytes = DEFAULT_MAX,
  } = props;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ kind: "idle" | "success" | "error"; text: string }>({
    kind: "idle",
    text: "",
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = !!selectedFile && !!category && !uploading;

  const fileInfoText = useMemo(() => {
    if (!selectedFile) return "";
    const catText = category ? ` | Category: ${category}` : "";
    return `Selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})${catText}`;
  }, [selectedFile, category]);

  const showSizeError = useCallback((file?: File | null) => {
    setSelectedFile(null);
    if (inputRef.current) {
      try {
        inputRef.current.value = "";
      } catch {
        console.error("Error clearing input value");
      }
    }
    const sizeText =
      file && typeof file.size === "number" ? `Selected: ${formatFileSize(file.size)}.` : "";
    setResult({
      kind: "error",
      text: `❌ File too large. Maximum allowed size is 250 MB. ${sizeText}\nPlease choose a smaller file.`,
    });
  }, []);

  const acceptFileOrError = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (file.size > maxFileSizeBytes) {
        showSizeError(file);
        return;
      }
      setSelectedFile(file);
      setResult((r) => (r.kind === "error" ? { kind: "idle", text: "" } : r));
    },
    [maxFileSizeBytes, showSizeError]
  );

  const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      acceptFileOrError(f);
    },
    [acceptFileOrError]
  );

  const onDragEnterOver = useCallback<React.DragEventHandler<HTMLDivElement>>((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeaveDrop = useCallback<React.DragEventHandler<HTMLDivElement>>((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const onDrop = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const dt = e.dataTransfer;
      const files = dt?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      // Try to reflect in the hidden input to satisfy native required
      if (inputRef.current) {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          inputRef.current.files = dataTransfer.files;
        } catch {
          console.error("Error setting input files");
        }
      }
      acceptFileOrError(file);
      try {
        dt?.clearData();
      } catch {
        console.error("Error clearing data transfer");
      }
    },
    [acceptFileOrError]
  );

  const onBrowseClick = useCallback<React.MouseEventHandler<HTMLAnchorElement>>((e) => {
    e.preventDefault();
    inputRef.current?.click();
  }, []);

  const onDropAreaKeyDown = useCallback<React.KeyboardEventHandler<HTMLDivElement>>((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const onCategoryChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>((e) => {
    setCategory(e.target.value);
  }, []);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      if (!selectedFile) return;
      if (!category) {
        alert("Please choose a document category.");
        return;
      }
      if (selectedFile.size > maxFileSizeBytes) {
        showSizeError(selectedFile);
        return;
      }
      setUploading(true);
      setResult({ kind: "idle", text: "Uploading document to claim..." });
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("fileName", selectedFile.name);
        formData.append("claimCategory", category);
        formData.append("claimName", claimName);
        formData.append("claimId", claimId);
        formData.append("fullName", fullName);
        formData.append("userId", userId);

        const resp = await fetch(uploadUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => "");
          throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
        }

        await resp.json().catch(() => ({}));
        const successFileName = selectedFile?.name || "your file";
        const successCategory = category ? ` in category “${category}”` : "";
        setResult({
          kind: "success",
          text: `✅ Success! ${successFileName} uploaded${successCategory}.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResult({
          kind: "error",
          text: `❌ ERROR!\n\n${msg}\n\nCheck the console for more details.`,
        });
        // Surface to console for debugging parity with original
        console.error("Upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [
      category,
      claimId,
      claimName,
      fullName,
      maxFileSizeBytes,
      selectedFile,
      showSizeError,
      token,
      uploadUrl,
      userId,
    ]
  );

  const showForm = result.kind !== "success";

  return (
    <div>
      {showForm && (
        <form className="upload-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="categorySelect">
              Category{" "}
              <span className="required" aria-hidden="true">
                * Required
              </span>
            </label>
            <select
              id="categorySelect"
              className="select-input"
              required
              aria-required="true"
              value={category}
              onChange={onCategoryChange}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div
            className={`upload-area${dragOver ? " dragover" : ""}`}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="File upload area. Click to browse or drag and drop a document"
            onDragEnter={onDragEnterOver}
            onDragOver={onDragEnterOver}
            onDragLeave={onDragLeaveDrop}
            onDrop={onDrop}
            onKeyDown={onDropAreaKeyDown}>
            <div className="drop-content">
              <div className="upload-icon" aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 5v10M12 5l-4 4M12 5l4 4M5 19h14"
                    stroke="#0f766e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="drop-text">
                Drop a file here to upload, or
                <br />
                <a href="#" className="browse-link" onClick={onBrowseClick}>
                  click here to browse
                </a>
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="file-input"
              required
              aria-required="true"
              onChange={onInputChange}
            />
          </div>

          {selectedFile && (
            <div className={`file-info ${selectedFile ? "ready" : ""}`}>{fileInfoText}</div>
          )}

          <button className="test-btn" id="uploadBtn" type="submit" disabled={!canSubmit}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      <div
        className={`result${
          result.kind === "success" ? " success" : result.kind === "error" ? " error" : ""
        }`}
        style={{ display: result.kind === "idle" && !result.text ? "none" : "block" }}>
        {result.text}
      </div>
    </div>
  );
}

export default UploadWidget;
