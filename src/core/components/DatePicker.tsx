import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    maxDate?: Date;
    minDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    selectedDate,
    onDateSelect,
    maxDate = new Date(),
    minDate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewingMonth, setViewingMonth] = useState(new Date(selectedDate));
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Actualizar mes cuando cambia selectedDate
    useEffect(() => {
        setViewingMonth(new Date(selectedDate));
    }, [selectedDate]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Días vacíos al inicio
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Días del mes
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const goToPreviousMonth = () => {
        setViewingMonth(new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        const next = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1, 1);
        if (next <= maxDate) {
            setViewingMonth(next);
        }
    };

    const handleDateClick = (date: Date) => {
        if (date <= maxDate && (!minDate || date >= minDate)) {
            onDateSelect(date);
            setIsOpen(false);
        }
    };

    const isSelected = (date: Date) => {
        return date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
    };

    const isToday = (date: Date) => {
        return date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    };

    const isDisabled = (date: Date) => {
        return date > maxDate || (minDate && date < minDate);
    };

    const formatDisplayDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dateStr === todayStr) return 'Hoy';
        if (dateStr === yesterdayStr) return 'Ayer';

        return date.toLocaleDateString('es-CL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const days = getDaysInMonth(viewingMonth);
    const monthName = viewingMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 font-semibold rounded-lg transition-colors shadow-sm"
            >
                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                <span>{formatDisplayDate(selectedDate)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Modal/Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 min-w-[280px]">
                    {/* Header del mes */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-gray-900 capitalize">{monthName}</span>
                        <button
                            onClick={goToNextMonth}
                            disabled={viewingMonth.getMonth() >= maxDate.getMonth() && viewingMonth.getFullYear() >= maxDate.getFullYear()}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, index) => (
                            <div key={index} className="aspect-square">
                                {date ? (
                                    <button
                                        onClick={() => handleDateClick(date)}
                                        disabled={isDisabled(date)}
                                        className={`
                      w-full h-full flex items-center justify-center text-sm rounded-lg transition-colors
                      ${isSelected(date)
                                                ? 'bg-gray-800 text-white font-semibold'
                                                : isToday(date)
                                                    ? 'bg-gray-100 text-gray-900 font-semibold'
                                                    : isDisabled(date)
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                            }
                    `}
                                    >
                                        {date.getDate()}
                                    </button>
                                ) : (
                                    <div />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Botón Hoy */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => handleDateClick(new Date())}
                            className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Ir a Hoy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
