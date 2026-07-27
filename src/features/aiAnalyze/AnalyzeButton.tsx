// src/features/ai-analyze/AnalyzeButton.tsx
import React from 'react';

const BUTTON_STYLES = `
.lca-btn-wrapper { display: inline-flex; align-items: center; margin-left: 4px; }
.lca-analyze-btn {
  all: initial;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(114deg, rgba(175, 82, 222, 0.15) 8%, rgba(0, 122, 255, 0.15) 150.58%);
  border: none;
}
.lca-analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lca-btn-text {
  background-image: linear-gradient(114deg, rgb(175, 82, 222) 8%, rgb(0, 122, 255) 150.58%);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
`;

interface AnalyzeButtonProps {
	loading: boolean;
	onClick: (e: React.MouseEvent) => void;
}

export default function AnalyzeButton({ loading, onClick }: AnalyzeButtonProps) {
	return (
		<div className="lca-btn-wrapper">
			<style>{BUTTON_STYLES}</style>
			<button onClick={onClick} disabled={loading} className="lca-analyze-btn">
				<span className="lca-btn-text">
					{loading ? '⏳ Analyzing...' : '🧠 Analyze'}
				</span>
			</button>
		</div>
	);
}
