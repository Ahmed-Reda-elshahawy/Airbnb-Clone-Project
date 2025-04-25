import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ChatMessage, SendMessageRequest } from '../models/ChatMessage';
import { Conversation } from '../models/Conversation';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'https://localhost:7200/api/chat';

  constructor(private http: HttpClient) { }

  getConversation(conversationId: string, userId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversation/${conversationId}`, {
      params: { userId }
    });
  }

  getAllConversations(userId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`, {
      params: { userId }
    });
  }

  getRecentConversations(userId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations/recent`, {
      params: { userId }
    });
  }

  sendMessage(request: SendMessageRequest): Observable<ChatMessage> {
    const payload = {
      userId: request.userId,
      message: request.message,
      conversationId: request.conversationId
    };
    return this.http.post<ChatMessage>(`${this.baseUrl}/send`, payload);
  }

  createConversation(userId: string): Observable<string> {
    const payload = { userId };
    return this.http.post<{ conversationId: string }>(`${this.baseUrl}/conversation`, payload)
      .pipe(map(response => response.conversationId));
  }
}