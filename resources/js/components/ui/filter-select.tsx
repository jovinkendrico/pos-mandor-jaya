import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function FilterSelect<T extends { id: number; name: string }>({
  label,
  value,
  options,
  onChange,
  placeholder,
  allLabel,
}: {
  label: string;
  value: string;
  options: T[];
  onChange: (value: string) => void;
  placeholder: string;
  allLabel: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48 min-w-48">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id.toString()}>
              <span className="truncate">{opt.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
