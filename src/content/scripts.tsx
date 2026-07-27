// src/content/script.tsx
import { setupNavigationListener } from '../utils/navigation';
import * as aiAnalyze from '../features/aiAnalyze/';
import * as companyTags from '../features/companyTags/'
import * as githubSync from '../features/githubSync/'

// Array of all active features to be initialized
const features = [
	aiAnalyze, companyTags, githubSync
];

async function runActiveFeatures() {
	console.log('[LC Analyzer] ⚙️ Checking features for URL:', location.href);

	for (const feature of features) {
		if (feature.include()) {
			feature.init();
		}
	}
}


setupNavigationListener();

runActiveFeatures();

document.addEventListener('lc:navigate', runActiveFeatures);
