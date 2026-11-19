"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";

export default function ImagePicker({ name, label, value = "", onChange, onUploadStateChange, multiple = false, rows = 1 }) {
  const inputId = useId();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const urls = (multiple ? String(value).split(/[\n,]+/) : [String(value)]).map((url) => url.trim()).filter(Boolean);

  function changeValue(nextValue) {
    setMessage(""); setFailed(false);
    if (fieldError) setFieldError(imageAddressError(nextValue, multiple));
    onChange({ target: { name, value: nextValue } });
  }

  async function upload(files) {
    const selected = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) { setFailed(true); setMessage("Choose a supported image from your device."); return; }
    if (!multiple && selected.length > 1) selected.splice(1);
    if (multiple && selected.length + urls.length > 8) { setFailed(true); setMessage("Add up to 8 images in this field."); return; }

    setUploading(true); onUploadStateChange?.(true); setMessage(""); setFailed(false);
    try {
      const uploaded = await Promise.all(selected.map(async (file) => {
        const optimized = await optimizeImage(file);
        const payload = new FormData();
        payload.append("file", optimized, optimized.name || file.name);
        const response = await fetch("/api/admin/media", { method: "POST", body: payload });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}.`);
        return result.url;
      }));
      const next = multiple ? [...urls, ...uploaded].join("\n") : uploaded[0];
      changeValue(next);
      setMessage(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded and saved.`);
    } catch (error) {
      setFailed(true); setMessage(error.message || "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(url) {
    const next = urls.filter((item) => item !== url);
    changeValue(multiple ? next.join("\n") : "");
  }

  const Field = multiple ? "textarea" : "input";
  return <div className="image-picker">
    <label className="image-picker-label" htmlFor={`${inputId}-url`}>{label}<span className="optional">PASTE AN IMAGE URL OR UPLOAD FROM YOUR DEVICE</span></label>
    <Field id={`${inputId}-url`} name={name} value={value} onChange={(event) => changeValue(event.target.value)} onBlur={() => setFieldError(imageAddressError(value, multiple))} aria-invalid={fieldError ? "true" : undefined} aria-describedby={fieldError ? `${inputId}-error` : undefined} data-validate-image-urls="true" rows={multiple ? rows : undefined} placeholder={multiple ? "One image URL per line" : "https://example.com/image.jpg"} />
    {fieldError && <span id={`${inputId}-error`} className="field-inline-error" role="alert">{fieldError}</span>}
    <div className={`image-upload-zone${dragging ? " image-upload-hover" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files); }}>
      <input ref={fileRef} className="image-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple={multiple} onChange={(event) => upload(event.target.files)} aria-label={`Upload ${label.toLowerCase()} from your device`} />
      <button type="button" className="image-upload-button" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <LoaderCircle className="upload-spinner" size={17} /> : <ImagePlus size={17} />}{uploading ? "Optimizing & uploading…" : "Choose from your device"}</button>
      <span>Drop images here · saved in your connected MongoDB · max 3 MB each</span>
    </div>
    {message && <p className={`image-picker-message${failed ? " image-picker-error" : ""}`} role={failed ? "alert" : "status"}>{message}</p>}
    {urls.length > 0 && <div className="image-picker-previews">{urls.map((url, index) => <div className="image-picker-preview" key={`${url}-${index}`}><img src={resolveImageUrl(url)} alt={`${label} preview ${index + 1}`} onError={(event) => { event.currentTarget.style.opacity = "0.25"; }} /><button type="button" onClick={() => removeImage(url)} aria-label={`Remove ${label.toLowerCase()} image ${index + 1}`}><X size={14} /></button></div>)}</div>}
  </div>;
}

function imageAddressError(value, multiple) {
  const entries = (multiple ? String(value).split(/[\n,]+/) : [String(value)]).map((item) => item.trim()).filter(Boolean);
  return entries.some((entry) => !isSupportedImageAddress(entry)) ? "Enter a complete image URL or upload an image from your device." : "";
}

function isSupportedImageAddress(value) {
  if (/^photo-[\w-]+$/.test(value) || /^\/api\/media\/[a-f\d]{24}$/i.test(value) || value.startsWith("/")) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

async function optimizeImage(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || !globalThis.createImageBitmap) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: Date.now() });
  } catch { return file; }
}

export function resolveImageUrl(value, width = 1000) {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^photo-[\w-]+$/.test(source)) return `https://images.unsplash.com/${source}?auto=format&fit=crop&w=${width}&q=85`;
  if (/^images\.unsplash\.com\//.test(source)) return `https://${source}`;
  return source;
}
