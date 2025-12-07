import { useState } from 'react';
import { 
  ResponsiveGrid, 
  ResponsiveContainer, 
  ResponsiveSection,
  ResponsiveStack,
  TouchButton,
  TouchIconButton,
  Card,
  Table
} from './index';
import { useIsMobile, useIsTablet, useIsDesktop, useIsTouchDevice } from '../../hooks';
import { Menu, Settings, User, Bell } from 'lucide-react';

/**
 * ResponsiveDemo - Demonstrates responsive design features
 */
const ResponsiveDemo = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isTouch = useIsTouchDevice();
  
  const [activeTab, setActiveTab] = useState('grid');
  
  // Sample data for table
  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  ];
  
  const tableColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', hideOnMobile: true },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ];
  
  return (
    <ResponsiveContainer maxWidth="7xl">
      <ResponsiveSection spacing="normal">
        <ResponsiveStack spacing="normal">
          {/* Device Info */}
          <Card>
            <h2 className="text-2xl font-bold mb-4">Device Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="text-lg font-semibold">{isMobile ? '✓' : '✗'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Tablet</p>
                <p className="text-lg font-semibold">{isTablet ? '✓' : '✗'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Desktop</p>
                <p className="text-lg font-semibold">{isDesktop ? '✓' : '✗'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Touch Device</p>
                <p className="text-lg font-semibold">{isTouch ? '✓' : '✗'}</p>
              </div>
            </div>
          </Card>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            <TouchButton
              variant={activeTab === 'grid' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('grid')}
            >
              Grid Layout
            </TouchButton>
            <TouchButton
              variant={activeTab === 'table' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('table')}
            >
              Responsive Table
            </TouchButton>
            <TouchButton
              variant={activeTab === 'buttons' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('buttons')}
            >
              Touch Buttons
            </TouchButton>
          </div>
          
          {/* Grid Demo */}
          {activeTab === 'grid' && (
            <Card>
              <h3 className="text-xl font-bold mb-4">Responsive Grid</h3>
              <p className="text-gray-600 mb-4">
                This grid adapts from 1 column on mobile to 4 columns on desktop
              </p>
              <ResponsiveGrid cols={1} sm={2} md={3} lg={4} gap="4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div
                    key={item}
                    className="p-6 bg-indigo-50 rounded-lg text-center"
                  >
                    <p className="text-lg font-semibold text-indigo-900">Item {item}</p>
                  </div>
                ))}
              </ResponsiveGrid>
            </Card>
          )}
          
          {/* Table Demo */}
          {activeTab === 'table' && (
            <Card>
              <h3 className="text-xl font-bold mb-4">Responsive Table</h3>
              <p className="text-gray-600 mb-4">
                On mobile, this table switches to a card view. On desktop, it shows as a traditional table.
              </p>
              <Table
                columns={tableColumns}
                data={tableData}
                mobileCardView={true}
              />
            </Card>
          )}
          
          {/* Touch Buttons Demo */}
          {activeTab === 'buttons' && (
            <Card>
              <h3 className="text-xl font-bold mb-4">Touch-Friendly Buttons</h3>
              <p className="text-gray-600 mb-4">
                These buttons automatically increase in size on touch devices for better usability
              </p>
              
              <ResponsiveStack spacing="normal">
                <div>
                  <h4 className="font-semibold mb-2">Button Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    <TouchButton variant="primary">Primary</TouchButton>
                    <TouchButton variant="secondary">Secondary</TouchButton>
                    <TouchButton variant="danger">Danger</TouchButton>
                    <TouchButton variant="ghost">Ghost</TouchButton>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Button Sizes</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <TouchButton size="sm">Small</TouchButton>
                    <TouchButton size="md">Medium</TouchButton>
                    <TouchButton size="lg">Large</TouchButton>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Icon Buttons</h4>
                  <div className="flex flex-wrap gap-2">
                    <TouchIconButton label="Menu">
                      <Menu className="h-5 w-5" />
                    </TouchIconButton>
                    <TouchIconButton label="Settings">
                      <Settings className="h-5 w-5" />
                    </TouchIconButton>
                    <TouchIconButton label="User">
                      <User className="h-5 w-5" />
                    </TouchIconButton>
                    <TouchIconButton label="Notifications">
                      <Bell className="h-5 w-5" />
                    </TouchIconButton>
                  </div>
                </div>
              </ResponsiveStack>
            </Card>
          )}
          
          {/* Responsive Spacing Demo */}
          <Card>
            <h3 className="text-xl font-bold mb-4">Responsive Spacing</h3>
            <p className="text-gray-600 mb-4">
              Spacing automatically adjusts based on screen size
            </p>
            <ResponsiveStack spacing="tight">
              <div className="p-4 bg-blue-50 rounded">Tight spacing item 1</div>
              <div className="p-4 bg-blue-50 rounded">Tight spacing item 2</div>
            </ResponsiveStack>
            
            <div className="my-8" />
            
            <ResponsiveStack spacing="normal">
              <div className="p-4 bg-green-50 rounded">Normal spacing item 1</div>
              <div className="p-4 bg-green-50 rounded">Normal spacing item 2</div>
            </ResponsiveStack>
            
            <div className="my-8" />
            
            <ResponsiveStack spacing="loose">
              <div className="p-4 bg-purple-50 rounded">Loose spacing item 1</div>
              <div className="p-4 bg-purple-50 rounded">Loose spacing item 2</div>
            </ResponsiveStack>
          </Card>
        </ResponsiveStack>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default ResponsiveDemo;
