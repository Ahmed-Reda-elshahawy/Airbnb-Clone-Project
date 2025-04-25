import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatMessage, SendMessageRequest } from './chat-bot.types';

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-bot.component.html',
  styleUrls: ['./chat-bot.component.css']
})
export class ChatBotComponent implements OnInit {
  isOpen = false;
  newMessage = '';
  messages: ChatMessage[] = [];
  currentConversationId: string | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.createNewConversation();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!this.validateUser(user)) return;
        const userId = user?.id;
        if (!userId) return;
        
        if (!this.currentConversationId) {
          this.createNewConversationAndSendMessage(userId);
        } else {
          this.sendMessageToApi(userId);
        }
      },
      error: (error) => this.handleAuthError(error)
    });
  }

  endConversation() {
    this.messages = [];
    this.createNewConversation();
    this.isOpen = false;
  }

  showRecentConversations() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!this.validateUser(user)) return;
        const userId = user?.id;
        if (!userId) return;
        this.loadRecentConversations(userId);
      },
      error: (error) => this.handleAuthError(error)
    });
  }

  private createNewConversation() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!this.validateUser(user)) return;
        const userId = user?.id;
        if (!userId) return;
        
        this.chatService.createConversation(userId).subscribe({
          next: (conversationId) => {
            this.currentConversationId = conversationId;
            this.loadConversation();
          },
          error: (error) => this.handleApiError('Error creating conversation:', error)
        });
      },
      error: (error) => this.handleAuthError(error)
    });
  }

  private createNewConversationAndSendMessage(userId: string) {
    this.chatService.createConversation(userId).subscribe({
      next: (conversationId) => {
        this.currentConversationId = conversationId;
        this.sendMessageToApi(userId);
      },
      error: (error) => this.handleApiError('Error creating conversation:', error)
    });
  }

  private sendMessageToApi(userId: string) {
    if (!this.currentConversationId) {
      console.error('No conversation ID available');
      return;
    }

    const request: SendMessageRequest = {
      userId,
      message: this.newMessage.trim(),
      conversationId: this.currentConversationId
    };

    this.addUserMessageToUI(userId);
    this.newMessage = '';

    this.chatService.sendMessage(request).subscribe({
      next: (response) => this.messages.push(response),
      error: (error) => this.handleMessageError(error)
    });
  }

  private loadConversation() {
    if (!this.currentConversationId) return;

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!this.validateUser(user)) return;
        const userId = user?.id;
        if (!userId) return;

        this.chatService.getConversation(this.currentConversationId!, userId).subscribe({
          next: (messages) => this.messages = messages,
          error: (error) => this.handleApiError('Error loading conversation:', error)
        });
      },
      error: (error) => this.handleAuthError(error)
    });
  }

  private loadRecentConversations(userId: string) {
    this.chatService.getRecentConversations(userId).subscribe({
      next: (conversations) => this.handleRecentConversations(conversations),
      error: (error) => this.handleApiError('Error loading recent conversations:', error)
    });
  }

  private validateUser(user: any): boolean {
    if (!user || !user.id) {
      this.addSystemMessage('Please log in to continue.');
      return false;
    }
    return true;
  }

  private addUserMessageToUI(userId: string) {
    this.messages.push({
      userId,
      isFromUser: true,
      content: this.newMessage,
      timestamp: new Date(),
      conversationId: this.currentConversationId || ''
    });
  }

  private addSystemMessage(content: string) {
    this.messages.push({
      userId: 'system',
      isFromUser: false,
      content,
      timestamp: new Date(),
      conversationId: this.currentConversationId || ''
    });
  }

  private handleRecentConversations(conversations: any[]) {
    if (conversations.length === 0) {
      this.addSystemMessage('No recent conversations found.');
      return;
    }

    this.messages = [];
    this.addSystemMessage('Here are your recent conversations:');

    conversations.forEach(conv => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      this.addSystemMessage(
        `Conversation from ${new Date(conv.createdAt).toLocaleString()}
Last message: ${lastMessage?.content || 'No messages'}`
      );
    });
  }

  private handleApiError(prefix: string, error: any) {
    console.error(prefix, error);
    this.addSystemMessage(error.error?.message || 'An error occurred. Please try again.');
  }

  private handleAuthError(error: any) {
    console.error('Error getting current user:', error);
    this.addSystemMessage('Error authenticating. Please try logging in again.');
  }

  private handleMessageError(error: any) {
    console.error('Error sending message:', error);
    if (error.status === 401) {
      this.addSystemMessage('Your session has expired. Please log in again.');
    } else {
      this.addSystemMessage(error.error?.message || 'Sorry, there was an error sending your message. Please try again.');
    }
  }
}
