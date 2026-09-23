import fs from 'fs';

const newCss = `:root {
  /* Premium Dark Theme */
  --bg-color: #0f1115;
  --bg-gradient: radial-gradient(circle at top right, rgba(29, 35, 50, 0.8) 0%, #0f1115 100%);
  --primary-color: #3b82f6; /* Modern Blue */
  --primary-glow: rgba(59, 130, 246, 0.4);
  --secondary-color: #8b5cf6; /* Modern Violet */
  --accent-color: #10b981; /* Modern Emerald */
  --text-main: #f8fafc;
  --text-sub: #94a3b8;
  --card-bg: rgba(30, 41, 59, 0.4);
  --card-border: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.05);
  --button-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  --button-text: #ffffff;
  --danger-color: #ef4444;
  --success-color: #10b981;
  --font-heading: 'Outfit', 'Pretendard', 'Noto Sans KR', sans-serif;
  --font-body: 'Pretendard', 'Noto Sans KR', sans-serif;
}

[data-theme="light"] {
  --bg-color: #f1f5f9;
  --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  --primary-color: #2563eb;
  --primary-glow: rgba(37, 99, 235, 0.2);
  --secondary-color: #7c3aed;
  --accent-color: #059669;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --card-bg: rgba(255, 255, 255, 0.7);
  --card-border: rgba(0, 0, 0, 0.05);
  --glass-highlight: rgba(255, 255, 255, 0.4);
  --button-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  --button-text: #ffffff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: var(--font-body);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

input, button, select, textarea {
  box-sizing: border-box;
  max-width: 100%;
}

html, body {
  background: var(--bg-color);
  background-image: var(--bg-gradient);
  color: var(--text-main);
  height: 100dvh;
  width: 100%;
  overflow: hidden; /* Prevent body scroll to fix bouncing/layout shifts */
  position: fixed; /* Lock viewport */
}

/* Base scroll container */
#root {
  height: 100dvh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Premium Soft Glass Containers */
.glass-panel {
  background: var(--card-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--card-border);
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.2);
  border-radius: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-panel-glow {
  box-shadow: 0 0 20px var(--primary-glow),
              0 8px 32px 0 rgba(0, 0, 0, 0.2);
}

.glass-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s ease;
}
.glass-card:hover {
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

/* Typography Utility */
.font-heading {
  font-family: var(--font-heading);
  letter-spacing: -0.02em;
}

.text-gradient {
  background: var(--button-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Buttons */
.btn-primary {
  background: var(--button-gradient);
  color: var(--button-text);
  font-weight: 700;
  font-size: 1.05rem;
  border: none;
  padding: 14px 28px;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 15px var(--primary-glow);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary:active {
  transform: scale(0.96);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border: 1px solid var(--card-border);
  font-weight: 600;
  padding: 12px 22px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Animations */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px var(--primary-glow); }
  50% { box-shadow: 0 0 25px var(--primary-glow); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-pulse-glow { animation: pulse-glow 2.5s infinite ease-in-out; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }

/* Responsive Container */
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .app-container { padding: 12px; }
  .glass-panel { padding: 16px !important; border-radius: 20px !important; }
}

/* Global Countdown Overlay */
.countdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 17, 21, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}
.countdown-number {
  font-size: 15rem;
  font-weight: 900;
  line-height: 1;
  font-family: var(--font-heading);
  background: linear-gradient(180deg, #fff 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: countdown-pop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
}
.countdown-text {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 20px;
  color: var(--text-sub);
}
@keyframes countdown-pop {
  0% { transform: scale(0.5); opacity: 0; }
  20% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}
`;

fs.writeFileSync('src/index.css', newCss, 'utf8');
console.log('CSS updated successfully');
