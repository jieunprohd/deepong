type FieldProps = {
    label: string;
    help?: React.ReactNode;
    children: React.ReactNode;
};

export function Field({label, help, children}: FieldProps) {
    return (
        <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                {label}
            </label>
            {children}
            {help && <p className="mt-1.5 text-xs text-gray-500">{help}</p>}
        </div>
    );
}
