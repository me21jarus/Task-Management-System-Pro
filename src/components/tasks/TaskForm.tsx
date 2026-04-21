import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Link as LinkIcon, FileUp, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Task } from "../../types/task";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(["link", "file"]),
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Valid URL required"),
    size: z.number().optional(),
  })),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TaskForm({ task, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const [showAddLink, setShowAddLink] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const linkLabelRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<any>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "Medium",
      dueDate: task?.dueDate || "",
      attachments: task?.attachments || [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments",
  });

  const handleAddLink = () => {
    const url = linkInputRef.current?.value;
    const name = linkLabelRef.current?.value;

    if (url && name) {
      append({
        id: crypto.randomUUID(),
        type: "link",
        name,
        url,
      });
      setShowAddLink(false);
      if (linkInputRef.current) linkInputRef.current.value = "";
      if (linkLabelRef.current) linkLabelRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      append({
        id: crypto.randomUUID(),
        type: "file",
        name: file.name,
        url,
        size: file.size,
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const priorityValue = watch("priority");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Title <span className="text-primary">*</span>
          </label>
          <Input
            {...register("title")}
            placeholder="What needs to be done?"
            error={errors.title?.message as string}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg text-sm bg-surface-elevated border border-border",
              "text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
              "transition-all duration-200 resize-none",
              errors.description && "border-danger focus:ring-danger/20 focus:border-danger/40"
            )}
            placeholder="Add some details..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-danger">{(errors.description?.message as any)}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority Pills */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(["Low", "Medium", "High"] as const).map((p) => (
                <label
                  key={p}
                  className={cn(
                    "flex-1 relative cursor-pointer group",
                    "h-10 flex items-center justify-center rounded-lg text-xs font-semibold border transition-all duration-200",
                    priorityValue === p
                      ? {
                          Low: "bg-gold/10 border-gold text-gold",
                          Medium: "bg-accent/10 border-accent text-accent",
                          High: "bg-primary/10 border-primary text-primary",
                        }[p]
                      : "bg-surface-elevated border-border text-text-muted hover:border-text-muted/40"
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={p}
                    {...register("priority")}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Due Date
            </label>
            <Input
              type="date"
              {...register("dueDate")}
              error={errors.dueDate?.message as string}
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <Paperclip size={14} className="text-text-muted" />
              Attachments
            </label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddLink(true)}
                className="h-8 px-2 text-xs gap-1"
              >
                <LinkIcon size={12} />
                Add link
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-2 text-xs gap-1"
              >
                <FileUp size={12} />
                Add file
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Add Link Inline Form */}
          <AnimatePresence>
            {showAddLink && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 bg-surface-elevated border border-border rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      ref={linkLabelRef}
                      placeholder="Label (e.g. Doc)"
                      className="w-full px-3 py-1.5 rounded-md text-xs bg-surface border border-border focus:outline-none focus:border-primary/40"
                    />
                    <input
                      ref={linkInputRef}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-md text-xs bg-surface border border-border focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddLink(false)}
                      className="h-7 text-[10px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddLink}
                      className="h-7 text-[10px]"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment Chips */}
          <div className="flex flex-wrap gap-2">
            {(fields as any[]).map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border border-border rounded-lg group"
              >
                {field.type === "link" ? (
                  <LinkIcon size={12} className="text-text-muted" />
                ) : (
                  <FileUp size={12} className="text-text-muted" />
                )}
                <span className="text-xs font-medium text-text truncate max-w-[150px]">
                  {field.name}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-text-muted hover:text-danger p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        >
          {task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
