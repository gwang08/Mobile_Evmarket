import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
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

export default function ChatbotScreen() {
  const navigation = useNavigation<ChatbotNavigationProp>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của EVmarket. Tôi có thể giúp bạn tìm kiếm xe điện hoặc pin phù hợp với nhu cầu của bạn. Hãy cho tôi biết bạn đang tìm gì nhé!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Suggested questions
  const suggestedQuestions = [
    'Tôi cần xe điện dưới 500 triệu',
    'Pin xe điện nào tốt nhất?',
    'Xe điện Tesla có những model nào?',
    'So sánh pin 60kWh và 80kWh',
  ];

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
    // Extract product type and ID from path like /vehicle/cmgnp83c8001wth4sf4k8jurr
    const match = path.match(/\/(vehicle|battery)\/(.+)/);
    if (match) {
      const [, type, id] = match;
      if (type === 'vehicle') {
        navigation.navigate('VehicleDetail', { vehicleId: id });
      } else if (type === 'battery') {
        navigation.navigate('BatteryDetail', { batteryId: id });
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.isUser;

    // Parse links in bot messages
    const renderMessageText = (text: string) => {
      if (isUser) {
        return <Text style={styles.messageText}>{text}</Text>;
      }

      // Split by links (format: /vehicle/id or /battery/id)
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
          {renderMessageText(item.text)}
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
          <Text style={styles.suggestionsTitle}>Gợi ý câu hỏi:</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
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
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  suggestionButton: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#2c3e50',
  },
  sendButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
});
