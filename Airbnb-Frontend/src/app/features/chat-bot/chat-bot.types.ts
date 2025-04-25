export interface SendMessageRequest {
  userId: string;
  message: string;
  conversationId: string;
}

export interface ChatState {
  isOpen: boolean;
  newMessage: string;
  messages: ChatMessage[];
  currentConversationId: string | null;
}

export interface ChatMessage {
  userId: string;
  isFromUser: boolean;
  content: string;
  timestamp: Date;
  conversationId: string;
}