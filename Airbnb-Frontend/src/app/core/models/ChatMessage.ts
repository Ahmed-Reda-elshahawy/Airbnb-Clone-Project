export interface ChatMessage {
    id?: number;
    userId: string;
    isFromUser: boolean;
    content: string;
    timestamp: Date;
    conversationId: string;
}

export interface SendMessageRequest {
    userId: string;
    message: string;
    conversationId: string;
}