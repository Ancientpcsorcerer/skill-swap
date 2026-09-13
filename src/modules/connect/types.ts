export interface Person {
  id: string; name: string; username?: string; skills: string[]; interests: string[]; projectInterests: string[]; description: string;
}
export interface ConnectionRequest {
  id: string; personId: string; direction: 'incoming' | 'outgoing'; status: 'pending' | 'accepted' | 'declined';
}
export type ConnectTab = 'people' | 'suggested' | 'requests';
