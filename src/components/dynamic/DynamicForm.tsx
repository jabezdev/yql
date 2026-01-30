import { useState } from "react";
import { Button } from "../ui/Button";

export interface FormField {
    id: string;
    label: string;
    type: string; // "text" | "email" | "textarea" | "select" | "number"
    options?: string[];
    required?: boolean;
    placeholder?: string;
    defaultValue?: string | number | string[];
}

interface DynamicFormProps {
    fields: FormField[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => void;
    submitLabel?: string;
    isLoading?: boolean;
}

export default function DynamicForm({
    fields,
    initialData = {},
    onSubmit,
    submitLabel = "Submit",
    isLoading = false
}: DynamicFormProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>(initialData);



    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (id: string, value: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1">
                    <label htmlFor={field.id} className="text-sm font-semibold text-gray-700">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === "textarea" ? (
                        <textarea
                            id={field.id}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent min-h-[120px]"
                        />
                    ) : field.type === "select" ? (
                        <select
                            id={field.id}
                            required={field.required}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white"
                        >
                            <option value="">Select an option</option>
                            {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            id={field.id}
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        />
                    )}
                </div>
            ))}

            <div className="pt-4">
                <Button
                    type="submit"
                    variant="geometric-primary"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                >
                    {isLoading ? "Saving..." : submitLabel}
                </Button>
            </div>
        </form>
    );
}
