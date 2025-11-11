'use client';

import {
    format,
    getMonth,
    getYear,
    setMonth as setMonthFns,
    setYear as setYearFns,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
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

    const [month, setMonth] = React.useState(value || new Date());

    const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        ' Mei',
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
        const newDate = setMonthFns(month, months.indexOf(monthStr));
        setMonth(newDate);
    };

    const handleYearChange = (year: string) => {
        const newDate = setYearFns(year, parseInt(year));
        setMonth(newDate);
    };

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            onChange(selectedDate);
        }
        setOpen(false);
    };

    React.useEffect(() => {
        if (value) {
            setMonth(value);
        }
    }, [value]);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!value}
                    className={cn(
                        'w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon />
                    {value ? (
                        format(value, 'yyyy-MM-dd')
                    ) : (
                        <span>Pick a date</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="flex justify-between p-2">
                    <Select
                        onValueChange={handleMonthChange}
                        value={months[getMonth(month)]}
                    >
                        <SelectTrigger className="w-[110px]">
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
                        value={getYear(month).toString()}
                    >
                        <SelectTrigger className="w-[110px]">
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
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonth}
                    locale={id}
                />
            </PopoverContent>
        </Popover>
    );
}
