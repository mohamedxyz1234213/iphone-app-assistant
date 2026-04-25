export const DEFAULT_BLOCKED_APPS = [
  { id: '1', name: 'Instagram', bundleId: 'com.burbn.instagram', icon: '📸', isSelected: false },
  { id: '2', name: 'TikTok', bundleId: 'com.zhiliaoapp.musically', icon: '🎵', isSelected: false },
  { id: '3', name: 'Twitter/X', bundleId: 'com.atebits.Tweetie2', icon: '🐦', isSelected: false },
  { id: '4', name: 'Facebook', bundleId: 'com.facebook.Facebook', icon: '👤', isSelected: false },
  { id: '5', name: 'Snapchat', bundleId: 'com.toyopagroup.picaboo', icon: '👻', isSelected: false },
  { id: '6', name: 'YouTube', bundleId: 'com.google.ios.youtube', icon: '▶️', isSelected: false },
  { id: '7', name: 'Reddit', bundleId: 'com.reddit.Reddit', icon: '🤖', isSelected: false },
  { id: '8', name: 'BeReal', bundleId: 'AlexisBarreyat.BeReal', icon: '📷', isSelected: false },
  { id: '9', name: 'Pinterest', bundleId: 'pinterest', icon: '📌', isSelected: false },
  { id: '10', name: 'LinkedIn', bundleId: 'com.linkedin.LinkedIn', icon: '💼', isSelected: false },
];

export const PRIORITY_LABELS: Record<string, string> = {
  urgent: '🔴 Urgent',
  high: '🟠 High',
  normal: '🔵 Normal',
  low: '🟢 Low',
};

export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const AI_MODELS = [
  { label: 'GPT-4o (Best)', value: 'gpt-4o' },
  { label: 'GPT-4o Mini (Fast)', value: 'gpt-4o-mini' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
];
