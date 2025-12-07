import { Calendar } from 'lucide-react';
import Select from '../shared/Select';

const PeriodSelector = ({ value, onChange, className }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Generate period options (last 12 months)
  const generatePeriodOptions = () => {
    const options = [];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = months[month];
      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${monthName} ${year}`;

      options.push({ value, label });
    }

    return options;
  };

  const periodOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: '─────────', disabled: true },
    ...generatePeriodOptions(),
  ];

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={periodOptions}
          className="min-w-[200px]"
        />
      </div>
    </div>
  );
};

export default PeriodSelector;
