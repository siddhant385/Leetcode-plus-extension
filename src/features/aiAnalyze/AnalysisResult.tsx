import React from 'react';
import { AnalysisResultData } from './types';

// Exact LeetCode native styling – compact, dark, developer-first
export const STYLES = `
.lca-section {
  border-radius: 8px;
  padding: 8px 16px;
  background: linear-gradient(114deg, rgba(175, 82, 222, 0.05) 8%, rgba(0, 122, 255, 0.05) 150.58%);
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 8px;
  width: 100%;
}

.lca-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.lca-section-title {
  background-image: linear-gradient(114deg, rgb(175, 82, 222) 8%, rgb(0, 122, 255) 150.58%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 500;
  font-size: 14px;
}

.lca-icon {
  font-size: 16px;
  line-height: 1;
}

.lca-divider {
  border: 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  margin: 4px 0 6px 0;
}

.lca-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.lca-label {
  color: #94a3b8;
  white-space: nowrap;
}

.lca-value {
  color: #e2e8f0;
}

.lca-value-green {
  color: #4ade80;
}

.lca-summary {
  font-size: 12px;
  color: #e2e8f0;
}

.lca-monospace {
  font-family: monospace;
  color: #e2e8f0;
}

.lca-monospace-green {
  font-family: monospace;
  color: #4ade80;
}

.lca-status-good {
  color: #4ade80;
  font-weight: 500;
  font-size: 12px;
}

.lca-status-average {
  color: #fbbf24;
  font-weight: 500;
  font-size: 12px;
}

.lca-status-poor {
  color: #f87171;
  font-weight: 500;
  font-size: 12px;
}

.lca-error {
  color: #f87171;
  padding: 12px;
  border: 1px solid #f87171;
  border-radius: 8px;
  background: rgba(248, 113, 113, 0.1);
}
`;

// Helper to map status strings to CSS classes
const getStatusClass = (status: string): string => {
	switch (status) {
		case 'Excellent': return 'lca-status-good';
		case 'Good': return 'lca-status-good';
		case 'Average': return 'lca-status-average';
		case 'Poor': return 'lca-status-poor';
		default: return 'lca-status-average';
	}
};

// ---- EXPORTED Sub-components ----
export const ApproachCard = ({ data }: { data: AnalysisResultData['approach'] }) => (
	<div className="lca-section">
		<div className="lca-section-header">
			<span className="lca-icon">✨</span>
			<span className="lca-section-title">Approach</span>
		</div>
		<div className="lca-summary">{data.summary}</div>
		<hr className="lca-divider" />
		<div className="lca-row">
			<span className="lca-label">Current:</span>
			<span className="lca-value">{data.current}</span>
		</div>
		<div className="lca-row">
			<span className="lca-label">Suggested:</span>
			<span className="lca-value-green">{data.suggested}</span>
		</div>
		<div className="lca-row">
			<span className="lca-label">Key Idea:</span>
			<span className="lca-value">{data.keyIdea}</span>
		</div>
	</div>
);

export const EfficiencyCard = ({ data }: { data: AnalysisResultData['efficiency'] }) => {
	const timeChanged = data.timeCurrent !== data.timeSuggested;
	const spaceChanged = data.spaceCurrent !== data.spaceSuggested;
	return (
		<div className="lca-section">
			<div className="lca-section-header">
				<span className="lca-icon">⚡</span>
				<span className="lca-section-title">Efficiency</span>
			</div>
			<div className="lca-row">
				<span className="lca-label">Time Complexity:</span>
				<span>
					<span className="lca-monospace">{data.timeCurrent}</span>
					<span className="lca-label" style={{ margin: '0 4px' }}>➔</span>
					<span className={timeChanged ? 'lca-monospace-green' : 'lca-monospace'}>
						{data.timeSuggested}
					</span>
				</span>
			</div>
			<div className="lca-row">
				<span className="lca-label">Space Complexity:</span>
				<span>
					<span className="lca-monospace">{data.spaceCurrent}</span>
					<span className="lca-label" style={{ margin: '0 4px' }}>➔</span>
					<span className={spaceChanged ? 'lca-monospace-green' : 'lca-monospace'}>
						{data.spaceSuggested}
					</span>
				</span>
			</div>
			<div className="lca-row">
				<span className="lca-label">Suggestions:</span>
				<span className="lca-value">{data.suggestions}</span>
			</div>
		</div>
	);
};

export const CodeStyleCard = ({ data }: { data: AnalysisResultData['codeStyle'] }) => (
	<div className="lca-section">
		<div className="lca-section-header">
			<span className="lca-icon">📏</span>
			<span className="lca-section-title">Code Style</span>
		</div>
		<div className="lca-row">
			<span className="lca-label">Readability:</span>
			<span className={getStatusClass(data.readability)}>{data.readability}</span>
		</div>
		<div className="lca-row">
			<span className="lca-label">Structure:</span>
			<span className={getStatusClass(data.structure)}>{data.structure}</span>
		</div>
		<div className="lca-row">
			<span className="lca-label">Suggestions:</span>
			<span className="lca-value">{data.suggestions}</span>
		</div>
	</div>
);

// ---- Convenience Combined Component (if you ever need to render them all at once) ----
export default function AnalysisResult({ data }: { data?: AnalysisResultData }) {
	if (!data) {
		return <div className="lca-error">⚠️ Analysis data is unavailable. Please try again.</div>;
	}
	return (
		<>
			<ApproachCard data={data.approach} />
			<EfficiencyCard data={data.efficiency} />
			<CodeStyleCard data={data.codeStyle} />
		</>
	);
}
