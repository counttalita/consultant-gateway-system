import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tendersService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import {
  Card,
  Button,
  Modal,
  Select,
  TextArea,
  SkeletonLoader
} from '../../components/shared';

/**
 * Tender Details Page
 * Displays detailed tender information and allows bid decision management
 * Requirements: 12.3, 12.4, 12.5
 */
const TenderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionForm, setDecisionForm] = useState({
    bid_decision: '',
    bid_rationale: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTender = async () => {
    setLoading(true);
    try {
      const data = await tendersService.getTender(id);
      setTender(data);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load tender details');
      if (error.response?.status === 404) {
        navigate('/admin/tenders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = () => {
    setDecisionForm({
      bid_decision: tender.bid_decision || 'pending',
      bid_rationale: tender.bid_rationale || ''
    });
    setShowDecisionModal(true);
  };

  const handleCloseDecisionModal = () => {
    setShowDecisionModal(false);
    setDecisionForm({
      bid_decision: '',
      bid_rationale: ''
    });
  };

  const handleUpdateDecision = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await tendersService.updateBidDecision(
        id,
        decisionForm.bid_decision,
        decisionForm.bid_rationale
      );
      showSuccess('Bid decision updated successfully');
      handleCloseDecisionModal();
      loadTender();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update bid decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this tender? This action cannot be undone.')) {
      return;
    }

    try {
      await tendersService.archiveTender(id);
      showSuccess('Tender archived successfully');
      navigate('/admin/tenders');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to archive tender');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
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

  const getBidDecisionBadgeClass = (decision) => {
    const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full';
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

  const getBidScoreColor = (score) => {
    if (!score && score !== 0) return 'text-gray-400';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBidScoreLabel = (score) => {
    if (!score && score !== 0) return 'Not Scored';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Tender not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tenders')}
            className="mb-2"
          >
            ← Back to Tenders
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{tender.title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className={getBidDecisionBadgeClass(tender.bid_decision)}>
            {formatBidDecision(tender.bid_decision)}
          </span>
          <Button
            variant="danger"
            onClick={handleArchive}
          >
            Archive Tender
          </Button>
        </div>
      </div>

      {/* Tender Information */}
      <Card title="Tender Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <p className="text-gray-900">{tender.client_name || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Value
            </label>
            <p className="text-gray-900">{formatCurrency(tender.estimated_value)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <p className="text-gray-900">{formatDate(tender.deadline)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <p className="text-gray-900">{tender.source || 'N/A'}</p>
          </div>

          {tender.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">{tender.description}</p>
            </div>
          )}

          {tender.requirements && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">{tender.requirements}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Bid Score and Decision */}
      <Card title="Bid Analysis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bid Score
            </label>
            <div className="flex items-baseline space-x-2">
              <p className={`text-3xl font-bold ${getBidScoreColor(tender.bid_score)}`}>
                {tender.bid_score !== null && tender.bid_score !== undefined ? `${tender.bid_score}%` : 'N/A'}
              </p>
              <span className={`text-sm font-medium ${getBidScoreColor(tender.bid_score)}`}>
                {getBidScoreLabel(tender.bid_score)}
              </span>
            </div>
            {tender.bid_score !== null && tender.bid_score !== undefined && (
              <p className="text-sm text-gray-500 mt-2">
                {tender.bid_score >= 70 && 'Strong opportunity - recommended to bid'}
                {tender.bid_score >= 50 && tender.bid_score < 70 && 'Moderate opportunity - review carefully'}
                {tender.bid_score < 50 && 'Weak opportunity - consider declining'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Decision
            </label>
            <div className="flex items-center space-x-3">
              <span className={getBidDecisionBadgeClass(tender.bid_decision)}>
                {formatBidDecision(tender.bid_decision)}
              </span>
              <Button
                size="sm"
                onClick={handleOpenDecisionModal}
              >
                Override Decision
              </Button>
            </div>
          </div>

          {tender.bid_rationale && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decision Rationale
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">{tender.bid_rationale}</p>
            </div>
          )}

          {tender.scoring_breakdown && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scoring Breakdown
              </label>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {Object.entries(tender.scoring_breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metadata */}
      <Card title="Metadata">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created At
            </label>
            <p className="text-gray-900">{formatDate(tender.created_at)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Updated
            </label>
            <p className="text-gray-900">{formatDate(tender.updated_at)}</p>
          </div>
        </div>
      </Card>

      {/* Override Decision Modal */}
      <Modal
        isOpen={showDecisionModal}
        onClose={handleCloseDecisionModal}
        title="Override Bid Decision"
      >
        <form onSubmit={handleUpdateDecision} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Overriding the bid decision will replace the automated recommendation.
              Please provide a clear rationale for your decision.
            </p>
          </div>

          <Select
            label="Bid Decision"
            value={decisionForm.bid_decision}
            onChange={(e) => setDecisionForm({ ...decisionForm, bid_decision: e.target.value })}
            required
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'bid', label: 'Bid' },
              { value: 'no_bid', label: 'No Bid' }
            ]}
          />

          <TextArea
            label="Rationale"
            value={decisionForm.bid_rationale}
            onChange={(e) => setDecisionForm({ ...decisionForm, bid_rationale: e.target.value })}
            required
            rows={4}
            placeholder="Explain the reasoning behind this decision..."
            helperText="Provide a clear explanation for why this decision was made"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseDecisionModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || !decisionForm.bid_decision || !decisionForm.bid_rationale}
            >
              Update Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TenderDetails;
