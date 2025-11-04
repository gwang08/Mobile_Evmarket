import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatbotService } from '../services/chatbotService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type ChatbotNavigationProp = StackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: Array<{
    url: string;
    title: string;
  }>;
}

// Parse vehicle/battery links from chatbot response
const parseProductLinks = (answer: string): Array<{ url: string; title: string }> => {
  const links: Array<{ url: string; title: string }> = [];
  
  // Match pattern 1: * **Title** ... /vehicle/id or /battery/id
  const linkRegex1 = /\*\s+\*\*(.+?)\*\*.*?\/(vehicle|battery)\/([\w-]+)/g;
  let match;

  while ((match = linkRegex1.exec(answer)) !== null) {
    const [, title, type, id] = match;
    links.push({
      title: title.trim(),
      url: `/${type}/${id}`
    });
  }

  // Match pattern 2: * **Title**: https://...vercel.app/vehicle/id
  const linkRegex2 = /\*\s+\*\*(.+?)\*\*:?\s*https?:\/\/[^/]+\/(vehicle|battery)\/([\w-]+)/g;
  while ((match = linkRegex2.exec(answer)) !== null) {
    const [, title, type, id] = match;
    // Check if not already added
    if (!links.some(link => link.url === `/${type}/${id}`)) {
      links.push({
        title: title.trim(),
        url: `/${type}/${id}`
      });
    }
  }

  // Match pattern 3: Standalone URLs - try to find title in nearby text
  const linkRegex3 = /https?:\/\/[^/]+\/(vehicle|battery)\/([\w-]+)/g;
  const urlMatches = Array.from(answer.matchAll(linkRegex3));
  
  for (const urlMatch of urlMatches) {
    const [fullUrl, type, id] = urlMatch;
    const urlIndex = urlMatch.index || 0;
    
    // Check if not already added
    if (!links.some(link => link.url === `/${type}/${id}`)) {
      // Try to extract title from text before URL (look for **title** pattern in previous 100 chars)
      const textBefore = answer.substring(Math.max(0, urlIndex - 100), urlIndex);
      const titleMatch = textBefore.match(/\*\*([^*]+)\*\*[^*]*$/);
      
      const title = titleMatch 
        ? titleMatch[1].trim() 
        : `Xem chi tiết ${type === 'vehicle' ? 'xe' : 'pin'}`;
      
      links.push({
        title,
        url: `/${type}/${id}`
      });
    }
  }

  return links;
};

// Format markdown text for display - Remove URLs from text
const formatMessageText = (text: string): string => {
  return text
    .replace(/^\*\s+/gm, '• ') // Convert markdown bullets to •
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
    .replace(/https?:\/\/[^\s]+/g, ''); // Remove URLs from text
};

export default function ChatbotWidget() {
  const navigation = useNavigation<ChatbotNavigationProp>();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của EVmarket. Tôi có thể giúp bạn tìm kiếm xe điện hoặc pin phù hợp. Hãy cho tôi biết bạn đang tìm gì nhé!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const suggestedQuestions = [
    'Tôi cần xe điện dưới 500 triệu',
    'Pin xe điện nào tốt nhất?',
    'Xe điện Tesla có những model nào?',
  ];

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  // Pulse animation for FAB
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await chatbotService.askChatbot(userMessage.text);

      // Parse links from response
      const links = parseProductLinks(response.answer);
      const formattedText = formatMessageText(response.answer);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: formattedText,
        isUser: false,
        timestamp: new Date(),
        links: links.length > 0 ? links : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error asking chatbot:', error);
      
      // Xác định loại lỗi và hiển thị message phù hợp
      let errorText = 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn.';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorText = 'Kết nối quá lâu. Server có thể đang bận, vui lòng thử lại sau.';
      } else if (error.response?.status === 400) {
        errorText = 'Câu hỏi không hợp lệ. Vui lòng thử đặt câu hỏi khác về xe điện hoặc pin.';
      } else if (error.response?.status >= 500) {
        errorText = 'Server AI đang gặp sự cố. Vui lòng thử lại sau vài phút.';
      } else if (error.message === 'Network Error') {
        errorText = 'Không có kết nối internet. Vui lòng kiểm tra mạng và thử lại.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  const handleNavigateToProduct = (path: string) => {
    const match = path.match(/\/(vehicle|battery)\/(.+)/);
    if (match) {
      const [, type, id] = match;
      setIsOpen(false);
      if (type === 'vehicle') {
        navigation.navigate('VehicleDetail', { vehicleId: id });
      } else if (type === 'battery') {
        navigation.navigate('BatteryDetail', { batteryId: id });
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.isUser;

    // Render formatted text with proper styling
    const renderFormattedText = (text: string) => {
      const lines = text.split('\n');
      
      return (
        <View>
          {lines.map((line, lineIndex) => {
            if (!line.trim()) return null;
            
            const parts = line.split(/(\*\*.+?\*\*)/g);
            
            return (
              <Text key={lineIndex} style={styles.messageText}>
                {parts.map((part, partIndex) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <Text key={partIndex} style={styles.boldText}>
                        {part.slice(2, -2)}
                      </Text>
                    );
                  }
                  return <Text key={partIndex}>{part}</Text>;
                })}
              </Text>
            );
          })}
        </View>
      );
    };

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {/* Avatar */}
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        
        <View style={styles.messageContent}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.botBubble,
            ]}
          >
            {isUser ? (
              <Text style={[styles.messageText, styles.userMessageText]}>{item.text}</Text>
            ) : (
              renderFormattedText(item.text)
            )}
            
            {/* Render product links if available */}
            {!isUser && item.links && item.links.length > 0 && (
              <View style={styles.linksContainer}>
                <Text style={styles.linksTitle}>🔗 Sản phẩm gợi ý:</Text>
                {item.links.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.linkButton}
                    onPress={() => {
                      setIsOpen(false);
                      handleNavigateToProduct(link.url);
                    }}
                  >
                    <Ionicons name="arrow-forward-circle" size={16} color="#3498db" />
                    <Text style={styles.linkButtonText} numberOfLines={1}>
                      {link.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Avatar */}
        {isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </View>
    );
  };

  const renderLoadingIndicator = () => {
    const dot1Anim = useRef(new Animated.Value(0.4)).current;
    const dot2Anim = useRef(new Animated.Value(0.4)).current;
    const dot3Anim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(dot1Anim, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Anim, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Anim, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animate());
      };

      animate();
    }, []);

    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
              <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
              <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="white" />
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color="white" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiIconContainer}>
                <Ionicons name="sparkles" size={20} color="#3498db" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Trợ lý AI</Text>
                <Text style={styles.headerSubtitle}>EVmarket Assistant</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={loading ? renderLoadingIndicator : null}
          />

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Gợi ý câu hỏi:</Text>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => handleSuggestedQuestion(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập câu hỏi của bạn..."
              placeholderTextColor="#95a5a6"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 95, // Tăng từ 85 lên 95 để tránh che bottom tabs mới (height 85)
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    fontSize: 20,
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#95a5a6',
    marginHorizontal: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#2c3e50',
  },
  userMessageText: {
    color: '#ffffff',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  linkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  linksContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  linksTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  linkButtonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#95a5a6',
    marginHorizontal: 8,
  },
  suggestionsContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#ecf0f1',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'flex-end',
    minHeight: 80,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    minHeight: 44,
    maxHeight: 100,
    fontSize: 15,
    color: '#2c3e50',
  },
  sendButton: {
    backgroundColor: '#3498db',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
});
