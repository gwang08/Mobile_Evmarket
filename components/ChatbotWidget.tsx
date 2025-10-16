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
}

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

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error asking chatbot:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
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

  const renderMessageText = (text: string, isUser: boolean) => {
    if (isUser) {
      return <Text style={styles.messageText}>{text}</Text>;
    }

    const parts = text.split(/(\/(vehicle|battery)\/[a-z0-9]+)/g);
    
    return (
      <Text style={styles.messageText}>
        {parts.map((part, index) => {
          if (part.match(/\/(vehicle|battery)\/[a-z0-9]+/)) {
            return (
              <Text
                key={index}
                style={styles.linkText}
                onPress={() => handleNavigateToProduct(part)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.isUser;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          {renderMessageText(item.text, isUser)}
        </View>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
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
    bottom: 85,
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
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
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
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#2c3e50',
  },
  linkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
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
