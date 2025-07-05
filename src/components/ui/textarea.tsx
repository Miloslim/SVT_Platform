// Exemple minimal de src/components/ui/textarea.tsx
import React from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  return (
    <textarea
      ref={ref}
      className="w-full border rounded-md p-2 focus:outline-none focus:ring"
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
