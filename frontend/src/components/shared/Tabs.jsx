import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

const Tabs = ({ tabs, defaultTab = 0, onChange, className }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const tabRefs = useRef([]);

  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  const handleKeyDown = (event, index) => {
    let newIndex = index;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = index < tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    handleTabChange(newIndex);
    tabRefs.current[newIndex]?.focus();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <div role="tablist" aria-label="Content tabs" className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              ref={(el) => (tabRefs.current[index] = el)}
              role="tab"
              id={`tab-${index}`}
              aria-selected={activeTab === index}
              aria-controls={`tabpanel-${index}`}
              tabIndex={activeTab === index ? 0 : -1}
              onClick={() => handleTabChange(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.icon && <span className="mr-2" aria-hidden="true">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="mt-6 focus:outline-none"
      >
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
