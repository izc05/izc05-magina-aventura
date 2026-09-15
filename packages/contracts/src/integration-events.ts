export interface RewardEarnedEvent {
  eventId: string;
  eventType: 'reward.earned';
  source: 'magina-aventura';
  userId: string;
  activityId: string;
  xp: number;
  olives: number;
  achievementIds: string[];
  occurredAt: string;
}
