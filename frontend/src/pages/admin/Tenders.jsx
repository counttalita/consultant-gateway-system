import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tendersService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { Card, Button, Table, Select, Input, SkeletonLoader } from '../../components/shared';

/**
 * Tenders List Page
 * Displays all tender opportunities with filtering capabilities
 * Requirements: 12.1, 12.2
 */
const Tenders = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    bid_decision: '',
    search: ''
  });

  useEffect(() => {
    loadTenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadTenders = async () => {
    setLoading(true);
    try {
      const data = await tendersService.getTenders(filters);
      setTenders(data.tenders || data);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (tenderId) => {
    navigate(`/admin/tenders/${tenderId}`);
  };

  const getBidDecisionBadgeClass = (decision) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (decision) {
      case 'bid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'no_bid':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatBidDecision = (decision) => {
    if (!decision) return 'Pending';
    return decision.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const columns = [
    {
      key: 'title',
      label: 'Tender Title',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'client_name',
      label: 'Client',
      render: (value) => (
        <span className="text-gray-700">{value || 'N/A'}</span>
      )
    },
    {
      key: 'estimated_value',
      label: 'Estimated Value',
      render: (value) => (
        <span className="text-gray-700">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'bid_score',
      label: 'Bid Score',
      render: (value) => {
        if (!value && value !== 0) return <span className="text-gray-400">N/A</span>;
        const scoreClass = value >= 70 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600';
        return (
          <span className={`font-semibold ${scoreClass}`}>
            {value}%
          </span>
        );
      }
    },
    {
      key: 'bid_decision',
      label: 'Decision',
      render: (value) => (
        <span className={getBidDecisionBadgeClass(value)}>
          {formatBidDecision(value)}
        </span>
      )
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (value) => {
        const date = formatDate(value);
        const isUpcoming = value && new Date(value) > new Date();
        const isPast = value && new Date(value) < new Date();
        return (
          <span className={isPast ? 'text-red-600' : isUpcoming ? 'text-gray-700' : 'text-gray-400'}>
            {date}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleViewDetails(row.id)}
        >
          View Details
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tenders</h1>
        </div>
        <Card>
          <SkeletonLoader type="table" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tenders</h1>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Bid Decision"
            value={filters.bid_decision}
            onChange={(e) => handleFilterChange('bid_decision', e.target.value)}
            options={[
              { value: '', label: 'All Decisions' },
              { value: 'pending', label: 'Pending' },
              { value: 'bid', label: 'Bid' },
              { value: 'no_bid', label: 'No Bid' }
            ]}
          />
          <Input
            label="Search"
            placeholder="Search by title or client..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </Card>

      {/* Tenders Table */}
      <Card>
        {tenders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tenders found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filters.bid_decision || filters.search
                ? 'Try adjusting your filters'
                : 'Tender opportunities will appear here once they are received'}
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={tenders}
            keyField="id"
          />
        )}
      </Card>
    </div>
  );
};

export default Tenders;
