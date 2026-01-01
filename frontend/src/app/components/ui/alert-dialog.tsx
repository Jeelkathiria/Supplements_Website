"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "./utils";
import { buttonVariants } from "./button";

interface ToastAlertProps extends React.ComponentProps<typeof AlertDialogPrimitive.Root> {
  duration?: number; // auto-dismiss duration in ms
  onClose?: () => void;
}

const AlertDialog = ({
  duration = 2000,
  onClose,
  ...props
}: ToastAlertProps) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return <AlertDialogPrimitive.Root {...props} />;
};

const AlertDialogTrigger = (props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) => (
  <AlertDialogPrimitive.Trigger {...props} />
);

const AlertDialogPortal = (props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) => (
  <AlertDialogPrimitive.Portal {...props} />
);

const AlertDialogOverlay = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
  />
);

const AlertDialogContent = ({ className, onClose, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content> & { onClose?: () => void }) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      className={cn(
        "bg-background fixed top-[50%] left-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-lg",
        className
      )}
      {...props}
    >
      {props.children}
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-sm font-bold hover:text-red-600"
      >
        ×
      </button>
    </AlertDialogPrimitive.Content>
  </AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
);

const AlertDialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);

const AlertDialogTitle = (props: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title className="text-lg font-semibold" {...props} />
);

const AlertDialogDescription = (props: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description className="text-muted-foreground text-sm" {...props} />
);

const AlertDialogAction = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) => (
  <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />
);

const AlertDialogCancel = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) => (
  <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />
);

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
