import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatBotComponent } from './chat-bot.component';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ChatBotComponent', () => {
  let component: ChatBotComponent;
  let fixture: ComponentFixture<ChatBotComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockConversationId = 'test-conversation-id';

  beforeEach(async () => {
    mockChatService = jasmine.createSpyObj('ChatService', [
      'createConversation',
      'sendMessage',
      'getConversation',
      'getRecentConversations'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [ChatBotComponent, FormsModule, RouterModule],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    mockAuthService.getCurrentUser.and.returnValue(of(mockUser));
    mockChatService.createConversation.and.returnValue(of(mockConversationId));
    mockChatService.getConversation.and.returnValue(of([]));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with a new conversation', () => {
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(mockChatService.createConversation).toHaveBeenCalledWith(mockUser.id);
    expect(mockChatService.getConversation).toHaveBeenCalledWith(mockConversationId, mockUser.id);
  });

  it('should toggle chat visibility', () => {
    expect(component.isOpen).toBeFalse();
    component.toggleChat();
    expect(component.isOpen).toBeTrue();
    component.toggleChat();
    expect(component.isOpen).toBeFalse();
  });

  it('should send message when user is authenticated', () => {
    const testMessage = 'Hello, world!';
    component.newMessage = testMessage;
    component.currentConversationId = mockConversationId;
    
    mockChatService.sendMessage.and.returnValue(of({
      userId: mockUser.id,
      isFromUser: false,
      content: 'Response message',
      timestamp: new Date(),
      conversationId: mockConversationId
    }));

    component.sendMessage();

    expect(mockChatService.sendMessage).toHaveBeenCalledWith({
      userId: mockUser.id,
      message: testMessage,
      conversationId: mockConversationId
    });
    expect(component.messages.length).toBe(2); // User message + response
    expect(component.newMessage).toBe('');
  });

  it('should handle auth error when sending message', () => {
    mockAuthService.getCurrentUser.and.returnValue(throwError(() => new Error('Auth Error')));
    component.newMessage = 'Test message';
    
    component.sendMessage();

    expect(component.messages.length).toBe 1);
    expect(component.messages[0].content).toContain('Error authenticating');
  });

  it('should end conversation and create new one', () => {
    component.messages = [{ userId: '1', content: 'test', isFromUser: true, timestamp: new Date(), conversationId: '1' }];
    component.isOpen = true;

    component.endConversation();

    expect(component.messages).toEqual([]);
    expect(component.isOpen).toBeFalse();
    expect(mockChatService.createConversation).toHaveBeenCalled();
  });

  it('should load recent conversations', () => {
    const mockConversations = [{
      id: '1',
      createdAt: new Date(),
      messages: [{ content: 'Last message' }]
    }];

    mockChatService.getRecentConversations.and.returnValue(of(mockConversations));

    component.showRecentConversations();

    expect(mockChatService.getRecentConversations).toHaveBeenCalledWith(mockUser.id);
    expect(component.messages.length).toBeGreaterThan(0);
    expect(component.messages[0].content).toContain('Here are your recent conversations');
  });

  it('should handle error when loading recent conversations', () => {
    mockChatService.getRecentConversations.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.showRecentConversations();

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].content).toContain('An error occurred');
  });
});
