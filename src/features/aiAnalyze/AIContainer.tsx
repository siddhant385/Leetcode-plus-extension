import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { messageRuntime } from 'webext-msg';
import AnalyzeButton from './AnalyzeButton';
import AnalysisResult, { STYLES } from './AnalysisResult';
import { AnalysisResultData } from './types';

interface AIContainerProps {
	dashboardTarget: Element;
}

export default function AIContainer({ dashboardTarget }: AIContainerProps) {
	const [loading, setLoading] = useState(false);
	const [analysisData, setAnalysisData] = useState<AnalysisResultData | null>(null);

	const getSubmissionId = () => {
		const match = window.location.href.match(/\/submissions\/(\d+)/);
		return match ? parseInt(match[1], 10) : null;
	};

	const handleAnalyze = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const submissionId = getSubmissionId();
		if (!submissionId) {
			alert("Submission ID nahi mili URL me!");
			return;
		}

		setLoading(true);
		try {
			const response = (await messageRuntime({
				ANALYZE_SUBMISSION: { submissionId }
			})) as any;

			const data = response?.data || response;

			if (data && 'approach' in data) {
				setAnalysisData(data as AnalysisResultData);
			} else {
				console.error('[LC Analyzer] Invalid data:', data);
			}
		} catch (error) {
			console.error('[LC Analyzer] Analysis failed:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<style>{STYLES}</style>

			<AnalyzeButton loading={loading} onClick={handleAnalyze} />

			{analysisData && createPortal(
				<div style={{ paddingBottom: '16px' }}>
					<AnalysisResult data={analysisData} />
				</div>,
				dashboardTarget
			)}
		</>
	);
}
