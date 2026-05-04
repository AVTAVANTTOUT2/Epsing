type PlayerAvatarProps = {
  username: string;
  size?: 'sm' | 'md' | 'lg';
};

const AVATAR_COLORS = [
  '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#6366F1', '#8B5CF6', '#14B8A6', '#F97316'
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function PlayerAvatar({ username, size = 'md' }: PlayerAvatarProps) {
  const colorIndex = hashString(username) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];
  const initials = getInitials(username);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-[13px]',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white`}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}
