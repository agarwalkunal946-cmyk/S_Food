"use client";

import { Children, Fragment, cloneElement, isValidElement, useState } from "react";

const FIELD_TAGS = new Set(["input", "select", "textarea"]);
const REQUIRED_LABELS = {
  customer: "your full name", email: "your email address", address: "your street address",
  city: "your city", password: "your password", name: "a product name", category: "a category",
};

export default function ValidatedForm({ children, onSubmit, noValidate = true, ...props }) {
  const [errors, setErrors] = useState({});

  function submit(event) {
    const controls = Array.from(event.currentTarget.elements).filter((control) => control.name && typeof control.checkValidity === "function");
    const nextErrors = {};
    for (const control of controls) {
      const message = validationMessage(control);
      if (message) nextErrors[control.name] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      controls.find((control) => nextErrors[control.name])?.focus();
      return;
    }
    onSubmit?.(event);
  }

  function updateError(name, control) {
    const message = validationMessage(control);
    setErrors((current) => {
      if (!current[name] && !message) return current;
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function enhance(nodes) {
    return Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      const isDom = typeof node.type === "string";
      const canRecurse = isDom || node.type === Fragment;
      if (!canRecurse) return node;
      const children = enhance(node.props.children);
      if (!isDom || !FIELD_TAGS.has(node.type) || !node.props.name) {
        return cloneElement(node, undefined, children);
      }

      const name = node.props.name;
      const error = errors[name];
      const previousBlur = node.props.onBlur;
      const previousChange = node.props.onChange;
      const describedBy = [node.props["aria-describedby"], error ? `${name}-inline-error` : null].filter(Boolean).join(" ") || undefined;
      return <Fragment key={node.key || name}>
        {cloneElement(node, {
          children,
          "aria-invalid": error ? "true" : node.props["aria-invalid"],
          "aria-describedby": describedBy,
          onBlur: (event) => { previousBlur?.(event); updateError(name, event.currentTarget); },
          onChange: (event) => { previousChange?.(event); updateError(name, event.currentTarget); },
        })}
        {error && <span id={`${name}-inline-error`} className="field-inline-error" role="alert">{error}</span>}
      </Fragment>;
    });
  }

  return <form {...props} noValidate={noValidate} onSubmit={submit}>{enhance(children)}</form>;
}

function validationMessage(control) {
  const name = String(control.getAttribute("aria-label") || control.name || "this field").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").toLowerCase();
  const validity = control.validity;
  if (validity.valueMissing) return control.type === "checkbox" ? "Please confirm this option." : `Please enter ${REQUIRED_LABELS[control.name] || `${article(name)}${name}`}.`;
  if (validity.typeMismatch) return control.type === "email" ? "Enter a valid email address." : `Enter a valid ${name}.`;
  if (validity.badInput) return `Enter a valid ${name}.`;
  if (validity.rangeUnderflow) return `Enter a value of at least ${control.min}.`;
  if (validity.rangeOverflow) return `Enter a value no greater than ${control.max}.`;
  if (validity.stepMismatch) return `Use steps of ${control.step}.`;
  if (validity.tooShort) return `Enter at least ${control.minLength} characters.`;
  if (validity.tooLong) return `Use ${control.maxLength} characters or fewer.`;
  if (validity.patternMismatch) return control.dataset.validationMessage || `Check the format for ${name}.`;

  if (control.dataset.validateImageUrls) {
    const urls = control.value.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
    const invalid = urls.find((value) => !isSupportedImageAddress(value));
    if (invalid) return "Enter a complete image URL or upload an image from your device.";
  }
  return "";
}

function isSupportedImageAddress(value) {
  if (/^photo-[\w-]+$/.test(value) || /^\/api\/media\/[a-f\d]{24}$/i.test(value) || value.startsWith("/")) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

function article(value) { return /^[aeiou]/i.test(value) ? "an " : "a "; }
