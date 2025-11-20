'use client';

import {
    format,
    getMonth,
    getYear,
    setMonth as setMonthFns,
    setYear as setYearFns,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    startYear?: number;
    endYear?: number;
    className?: string;
}
export function DatePicker({
    value,
    onChange,
    startYear = getYear(new Date()) - 100,
    endYear = getYear(new Date()) + 100,
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const [monthView, setMonthView] = React.useState<Date>(value || new Date());

    const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (P, index) => startYear + index,
    );

    const handleMonthChange = (monthStr: string) => {
        const newDate = setMonthFns(monthView, months.indexOf(monthStr));
        setMonthView(newDate);
    };

    const handleYearChange = (yearStr: string) => {
        const newDate = setYearFns(monthView, parseInt(yearStr));
        setMonthView(newDate);
    };

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            onChange(selectedDate);
            setMonthView(selectedDate);
        }
        setOpen(false);
    };

    React.useEffect(() => {
        if (value) {
            setMonthView(value);
        }
    }, [value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!value}
                    className={cn(
                        'w-full max-w-48 justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        format(value, 'yyyy-MM-dd')
                    ) : (
                        <span>Pick a date</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="flex justify-between p-2">
                    {/* Month Select */}
                    <Select
                        onValueChange={handleMonthChange}
                        value={months[getMonth(value || monthView)]}
                    >
                        <SelectTrigger className="combobox !w-[110px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={handleYearChange}
                        value={getYear(value || monthView).toString()}
                    >
                        <SelectTrigger className="combobox !w-[110px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Calendar Component */}
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    month={monthView}
                    onMonthChange={setMonthView}
                    locale={id}
                />
            </PopoverContent>
        </Popover>
    );
}
