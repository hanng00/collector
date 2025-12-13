export interface XPost {
  id: string;
  name: string;
  handle: string;
  avatarInitials: string;
  text: string;
  dateLabel: string;
  metrics: {
    replies: number;
    reposts: number;
    likes: number;
    bookmarks: number;
  };
}
