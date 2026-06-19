import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthYearFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (val: number) => void;
  onYearChange: (val: number) => void;
}

const months = [
  { val: 1, label: 'Januari' },
  { val: 2, label: 'Februari' },
  { val: 3, label: 'Maret' },
  { val: 4, label: 'April' },
  { val: 5, label: 'Mei' },
  { val: 6, label: 'Juni' },
  { val: 7, label: 'Juli' },
  { val: 8, label: 'Agustus' },
  { val: 9, label: 'September' },
  { val: 10, label: 'Oktober' },
  { val: 11, label: 'November' },
  { val: 12, label: 'Desember' },
];

export function MonthYearFilter({
  selectedMonth, selectedYear, onMonthChange, onYearChange,
}: MonthYearFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(selectedMonth)}
        onValueChange={(v) => onMonthChange(Number(v))}
      >
        <SelectTrigger className="w-[130px] h-8 border-none font-semibold text-xs shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.val} value={String(m.val)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(selectedYear)}
        onValueChange={(v) => onYearChange(Number(v))}
      >
        <SelectTrigger className="w-[100px] h-8 border-none font-semibold text-xs shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
