import { Modal } from "../ui/Modal";
import { TaskForm } from "./TaskForm";
import { type Task } from "../../types/task";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSubmit: (data: any) => Promise<void>;
}

export function TaskModal({ isOpen, onClose, task, onSubmit }: TaskModalProps) {
  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? "Edit Task" : "Create New Task"}
      maxWidth="md"
    >
      <TaskForm
        task={task}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
