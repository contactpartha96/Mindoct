import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../theme';
import { addMessage, clearChat } from '../store';
import OpenAI from 'openai';

export default function ChatScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const flatListRef = useRef();

  // Redux Selectors
  const messages = useSelector((state) => state.chat.messages);
  const activeRole = useSelector((state) => state.auth.activeRole);
  const selectedClass = useSelector((state) => state.curriculum.selectedClass);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize OpenAI client safely
  // TODO(security): Use a secure BFF backend service in production to avoid exposing the OpenAI API key on the client.
  const openaiKey = process.env.OPENAI_API_KEY;
  let openai = null;
  if (openaiKey) {
    openai = new OpenAI({
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true // Required for React Native/Client-side execution
    });
  }

  // Auto scroll to end on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // Sanitize input to prevent basic injection/XSS issues
    // Strip HTML tag structures
    const sanitizedText = trimmedInput.replace(/<\/?[^>]+(>|$)/g, "");

    // Add user message to store
    const userMsg = { id: Date.now().toString(), sender: 'user', text: sanitizedText };
    dispatch(addMessage(userMsg));
    setInput('');
    setLoading(true);

    try {
      let aiText = '';

      if (openai) {
        // Query live OpenAI API safely
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are Mindoct AI, a premium clinical therapy and mental wellness assistant. You provide simple, structured, and empathetic wellness guidance. Keep answers concise, helpful, and support general wellbeing. Do not diagnose conditions but provide general self-care advice. The user is currently focusing on ${selectedClass} wellness.`
            },
            {
              role: 'user',
              content: sanitizedText
            }
          ],
          max_tokens: 250,
          temperature: 0.7,
        });
        aiText = response.choices[0]?.message?.content || 'I could not compile a response. Try again.';
      } else {
        // Simulated local fallback database for testing without API keys
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
        const query = sanitizedText.toLowerCase();

        if (query.includes('anxiety') || query.includes('stress')) {
          aiText = "🩺 **Anxiety & Stress Management (CBT Techniques):**\nIf you are feeling overwhelmed, try the 4-7-8 Breathing Technique:\n1. Breathe in through your nose for 4 seconds.\n2. Hold your breath for 7 seconds.\n3. Exhale completely through your mouth for 8 seconds.\n\nThis triggers the body's parasympathetic nervous system and brings calm.";
        } else if (query.includes('sleep')) {
          aiText = "🌙 **Sleep Hygiene Tips:**\nFor optimal restorative sleep, practice the following daily:\n- Turn off all screens 1 hour before bed to limit blue light exposure.\n- Keep your bedroom cool, dark, and quiet.\n- Maintain a consistent bedtime and waking routine daily.";
        } else if (query.includes('mindfulness')) {
          aiText = "🧘 **Mindfulness Grounding Exercises:**\nTry the 5-4-3-2-1 Grounding Method to stay present:\n- Identify 5 things you can see around you.\n- 4 things you can physically touch.\n- 3 things you can hear.\n- 2 things you can smell.\n- 1 thing you can taste.";
        } else {
          aiText = `🩺 **Mindoct AI Wellness Companion Tip:**\nI have received your request regarding "${sanitizedText}". As your wellness coach, I can assist you with stress reduction methods. Try asking me about **anxiety**, **sleep**, or **mindfulness**!`;
        }
      }

      dispatch(addMessage({
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText
      }));

    } catch (error) {
      console.error('Error fetching AI doubt solution:', error);
      dispatch(addMessage({
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '❌ Error: Failed to synchronize with Mindoct AI wellness servers. Please check your network connection.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isAi = item.sender === 'ai';
    return (
      <View style={[
        styles.messageContainer,
        isAi ? styles.aiContainer : styles.userContainer
      ]}>
        {isAi && <Text style={styles.chatAvatar}>🩺</Text>}
        <View style={[
          styles.bubble,
          { 
            backgroundColor: isAi ? colors.surface : colors.primary,
            borderColor: colors.border,
            borderBottomLeftRadius: isAi ? 2 : 12,
            borderBottomRightRadius: isAi ? 12 : 2
          }
        ]}>
          <Text style={[
            styles.messageText, 
            { color: isAi ? colors.text : '#fff' }
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>AI Wellness Companion</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {selectedClass} Coach
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.clearBtn, { borderColor: colors.border }]} 
          onPress={() => dispatch(clearChat())}
        >
          <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading && (
            <View style={styles.typingContainer}>
              <Text style={styles.chatAvatar}>🩺</Text>
              <View style={[styles.bubble, styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )
        }
      />

      {/* Input keyboard tray */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ width: '100%' }}
      >
        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Ask Mindoct AI any wellness query..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: colors.primary }]} 
            onPress={handleSend}
          >
            <Text style={styles.sendIcon}>➔</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 14,
    paddingVertical: 4,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  chatAvatar: {
    fontSize: 20,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'center',
  },
  typingBubble: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
