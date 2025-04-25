import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation } from '../../core/models/Conversation';
import { ChatMessage } from '../../core/models/ChatMessage';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.css']
})
export class ConversationsComponent implements OnInit {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  loading = true;
  error: string | null = null;
  newMessage = '';

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadConversations();
  }

  private loadConversations() {
    this.loading = true;
    this.error = null;

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          this.error = 'Please log in to view your conversations';
          this.loading = false;
          return;
        }

        this.chatService.getAllConversations(user.id).subscribe({
          next: (conversations) => {
            this.conversations = conversations.sort((a, b) => 
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            );
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading conversations:', error);
            this.error = 'Failed to load conversations. Please try again.';
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error getting current user:', error);
        this.error = 'Error authenticating. Please try logging in again.';
        this.loading = false;
      }
    });
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    // Scroll to bottom of messages when conversation is selected
    setTimeout(() => {
      const messageContainer = document.querySelector('#messageContainer');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    });
  }

  getLastMessage(conversation: Conversation): string {
    if (!conversation.messages?.length) return 'No messages';
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.content;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          this.error = 'Please log in to send messages';
          return;
        }

        const request = {
          userId: user.id,
          message: this.newMessage.trim(),
          conversationId: this.selectedConversation!.id
        };

        this.chatService.sendMessage(request).subscribe({
          next: (message) => {
            if (this.selectedConversation?.messages) {
              this.selectedConversation.messages.push(message);
            }
            this.newMessage = '';
            // Scroll to bottom after sending message
            setTimeout(() => {
              const messageContainer = document.querySelector('#messageContainer');
              if (messageContainer) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
              }
            });
          },
          error: (error) => {
            console.error('Error sending message:', error);
            this.error = 'Failed to send message. Please try again.';
          }
        });
      },
      error: (error) => {
        console.error('Error getting current user:', error);
        this.error = 'Error authenticating. Please try logging in again.';
      }
    });
  }

  closeConversation() {
    this.selectedConversation = null;
  }
}