# frozen_string_literal: true

# Engine for evaluating tender opportunities against bid/no-bid criteria
# Provides scoring, risk assessment, and resource estimation
class BidDecisionEngine
  # Evaluation criteria with weights and thresholds
  CRITERIA = {
    scope_fit: { weight: 0.3, threshold: 7 },
    capacity: { weight: 0.25, threshold: 6 },
    budget: { weight: 0.25, threshold: 5 },
    timeline: { weight: 0.2, threshold: 6 }
  }.freeze

  # Recommendation threshold (weighted score)
  PURSUE_THRESHOLD = 6.5

  # Evaluate tender against bid/no-bid criteria
  # @param tender [Tender] The tender to evaluate
  # @return [Hash] Evaluation result with recommendation, score, breakdown, risks, and resources
  def evaluate(tender)
    # Calculate individual criterion scores
    scores = calculate_scores(tender)

    # Calculate weighted total score
    weighted_score = calculate_weighted_score(scores)

    # Determine recommendation
    recommendation = weighted_score >= PURSUE_THRESHOLD ? "Pursue" : "Decline"

    # Identify risks
    risks = identify_risks(tender, scores)

    # Estimate required resources
    resources = estimate_resources(tender)

    # Calculate revenue potential
    revenue_potential = calculate_revenue_potential(tender)

    # Build rationale
    rationale = build_rationale(recommendation, weighted_score, scores, risks)

    {
      recommendation: recommendation,
      score: weighted_score.round(2),
      breakdown: scores,
      risks: risks,
      required_resources: resources,
      revenue_potential: revenue_potential,
      rationale: rationale
    }
  end

  private

  # Calculate scores for each criterion
  # @param tender [Tender] The tender to evaluate
  # @return [Hash] Scores for each criterion (0-10 scale)
  def calculate_scores(tender)
    {
      scope_fit: calculate_scope_fit_score(tender),
      capacity: calculate_capacity_score(tender),
      budget: calculate_budget_score(tender),
      timeline: calculate_timeline_score(tender)
    }
  end

  # Calculate scope fit score based on required capabilities
  # @param tender [Tender] The tender to evaluate
  # @return [Float] Score from 0-10
  def calculate_scope_fit_score(tender)
    # Check if required capabilities match our core competencies
    core_competencies = [
      "change management",
      "organizational transformation",
      "stakeholder engagement",
      "process improvement",
      "training and development",
      "project management"
    ]

    return 5.0 if tender.required_capabilities.empty?

    # Calculate match percentage
    matches = tender.required_capabilities.count do |capability|
      core_competencies.any? { |comp| capability.downcase.include?(comp) }
    end

    match_percentage = matches.to_f / tender.required_capabilities.length

    # Convert to 0-10 scale
    (match_percentage * 10).round(1)
  end

  # Calculate capacity score based on current workload
  # @param tender [Tender] The tender to evaluate
  # @return [Float] Score from 0-10
  def calculate_capacity_score(tender)
    # Check consultant availability
    available_consultants = Consultant.where(availability_status: "available").count
    partially_available = Consultant.where(availability_status: "partially_available").count

    # Estimate required consultants (rough heuristic based on tender value)
    estimated_consultants_needed = estimate_consultants_needed(tender)

    # Calculate capacity score
    total_capacity = available_consultants + (partially_available * 0.5)

    if total_capacity >= estimated_consultants_needed * 1.5
      10.0 # Excellent capacity
    elsif total_capacity >= estimated_consultants_needed
      7.5 # Good capacity
    elsif total_capacity >= estimated_consultants_needed * 0.75
      5.0 # Marginal capacity
    else
      2.0 # Insufficient capacity
    end
  end

  # Calculate budget score based on tender value
  # @param tender [Tender] The tender to evaluate
  # @return [Float] Score from 0-10
  def calculate_budget_score(tender)
    return 5.0 if tender.tender_value.nil?

    # Score based on tender value ranges (ZAR)
    case tender.tender_value
    when 0..100_000
      3.0 # Too small
    when 100_001..500_000
      6.0 # Acceptable
    when 500_001..2_000_000
      9.0 # Good
    when 2_000_001..Float::INFINITY
      10.0 # Excellent
    else
      5.0
    end
  end

  # Calculate timeline score based on submission deadline
  # @param tender [Tender] The tender to evaluate
  # @return [Float] Score from 0-10
  def calculate_timeline_score(tender)
    return 5.0 if tender.submission_deadline.nil?

    days_until_deadline = ((tender.submission_deadline - Time.current) / 1.day).ceil

    # Score based on available time to prepare proposal
    case days_until_deadline
    when -Float::INFINITY..3
      2.0 # Too tight
    when 4..7
      5.0 # Challenging
    when 8..14
      7.5 # Reasonable
    when 15..30
      9.0 # Good
    when 31..Float::INFINITY
      10.0 # Excellent
    else
      5.0
    end
  end

  # Calculate weighted score from individual scores
  # @param scores [Hash] Individual criterion scores
  # @return [Float] Weighted total score
  def calculate_weighted_score(scores)
    total = 0.0

    CRITERIA.each do |criterion, config|
      score = scores[criterion] || 0
      weight = config[:weight]
      total += score * weight
    end

    total
  end

  # Identify risks based on scores and tender characteristics
  # @param tender [Tender] The tender to evaluate
  # @param scores [Hash] Individual criterion scores
  # @return [Array<String>] List of identified risks
  def identify_risks(tender, scores)
    risks = []

    # Check each criterion against threshold
    CRITERIA.each do |criterion, config|
      if scores[criterion] < config[:threshold]
        risks << format_risk_message(criterion, scores[criterion], config[:threshold])
      end
    end

    # Additional risk checks
    if tender.submission_deadline.present? && tender.days_until_deadline.to_i < 7
      risks << "Very tight deadline for proposal preparation"
    end

    if tender.tender_value.present? && tender.tender_value < 100_000
      risks << "Low tender value may not justify resource allocation"
    end

    if tender.required_capabilities.length > 5
      risks << "Large number of required capabilities may indicate scope creep risk"
    end

    risks
  end

  # Format risk message for a criterion
  # @param criterion [Symbol] The criterion
  # @param score [Float] The score
  # @param threshold [Float] The threshold
  # @return [String] Formatted risk message
  def format_risk_message(criterion, score, threshold)
    criterion_name = criterion.to_s.split("_").map(&:capitalize).join(" ")
    "#{criterion_name} score (#{score.round(1)}) below threshold (#{threshold})"
  end

  # Estimate required resources for the tender
  # @param tender [Tender] The tender to evaluate
  # @return [Hash] Resource estimates
  def estimate_resources(tender)
    consultants_needed = estimate_consultants_needed(tender)
    duration_weeks = estimate_duration_weeks(tender)

    {
      consultants: consultants_needed,
      duration_weeks: duration_weeks,
      total_person_weeks: consultants_needed * duration_weeks,
      skills_required: tender.required_capabilities
    }
  end

  # Estimate number of consultants needed
  # @param tender [Tender] The tender to evaluate
  # @return [Integer] Estimated number of consultants
  def estimate_consultants_needed(tender)
    return 2 if tender.tender_value.nil?

    # Rough heuristic: 1 consultant per R250k of tender value
    [ (tender.tender_value / 250_000).ceil, 1 ].max
  end

  # Estimate project duration in weeks
  # @param tender [Tender] The tender to evaluate
  # @return [Integer] Estimated duration in weeks
  def estimate_duration_weeks(tender)
    return 12 if tender.tender_value.nil?

    # Rough heuristic based on tender value
    case tender.tender_value
    when 0..250_000
      8
    when 250_001..1_000_000
      16
    when 1_000_001..Float::INFINITY
      24
    else
      12
    end
  end

  # Calculate revenue potential
  # @param tender [Tender] The tender to evaluate
  # @return [Hash] Revenue potential analysis
  def calculate_revenue_potential(tender)
    return { estimated_revenue: nil, margin_potential: "Unknown" } if tender.tender_value.nil?

    # Assume 70% win probability for "Pursue" recommendations
    # Assume 30% margin on tender value
    estimated_revenue = tender.tender_value * 0.7
    margin = tender.tender_value * 0.3

    margin_category = case margin
    when 0..50_000
                        "Low"
    when 50_001..200_000
                        "Medium"
    when 200_001..Float::INFINITY
                        "High"
    else
                        "Unknown"
    end

    {
      tender_value: tender.tender_value,
      estimated_revenue: estimated_revenue.round(2),
      estimated_margin: margin.round(2),
      margin_potential: margin_category
    }
  end

  # Build rationale text for the recommendation
  # @param recommendation [String] The recommendation (Pursue/Decline)
  # @param score [Float] The weighted score
  # @param scores [Hash] Individual criterion scores
  # @param risks [Array<String>] Identified risks
  # @return [String] Rationale text
  def build_rationale(recommendation, score, scores, risks)
    parts = []

    parts << "Overall score: #{score.round(2)}/10"
    parts << "Recommendation: #{recommendation}"
    parts << ""
    parts << "Score breakdown:"

    CRITERIA.each do |criterion, config|
      criterion_name = criterion.to_s.split("_").map(&:capitalize).join(" ")
      criterion_score = scores[criterion].round(1)
      threshold = config[:threshold]
      status = criterion_score >= threshold ? "✓" : "✗"
      parts << "  #{status} #{criterion_name}: #{criterion_score}/10 (threshold: #{threshold})"
    end

    if risks.any?
      parts << ""
      parts << "Identified risks:"
      risks.each { |risk| parts << "  - #{risk}" }
    end

    parts.join("\n")
  end
end
