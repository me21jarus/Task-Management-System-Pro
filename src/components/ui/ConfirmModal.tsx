import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";


export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "primary",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center">
        {variant === "danger" && (
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
            <AlertTriangle size={24} />
          </div>
        )}
        
        <p className="text-text-muted mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row-reverse gap-3 w-full">
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            className="w-full"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
