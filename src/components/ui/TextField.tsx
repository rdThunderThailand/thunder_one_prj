import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className, "aria-describedby": describedBy, "aria-invalid": isInvalid, ...props }, ref) => {
    const inputId = id ?? props.name;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <Input
          {...props}
          ref={ref}
          id={inputId}
          className={cn(
            "text-sm text-foreground",
            error ? "border-error focus-visible:ring-error" : "border-border",
            className,
          )}
          aria-invalid={error ? true : isInvalid ?? false}
          aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
        />
        {error && (
          <p id={errorId} className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = "TextField";
