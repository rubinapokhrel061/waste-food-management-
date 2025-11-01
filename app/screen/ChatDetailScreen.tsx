import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface Message {
  id?: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt?: Timestamp;
  participants: string[];
  imageUrl?: string;
  fileName?: string;
  fileType?: string;
  read?: boolean;
}

export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{ user: string }>();
  const selectedUser: User = JSON.parse(params.user);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showOptions, setShowOptions] = useState<boolean>(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;

        if (
          (data.senderId === currentUser.uid &&
            data.receiverId === selectedUser.id) ||
          (data.senderId === selectedUser.id &&
            data.receiverId === currentUser.uid)
        ) {
          msgs.push({ id: doc.id, ...data });

          // Mark message as read if it's from the other user and not already read
          if (data.senderId === selectedUser.id && !data.read) {
            updateDoc(doc.ref, { read: true });
          }
        }
      });

      msgs.sort((a, b) => {
        const t1 = a.createdAt?.toMillis() || 0;
        const t2 = b.createdAt?.toMillis() || 0;
        return t1 - t2;
      });

      setMessages(msgs);
      setLoading(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedUser.id]);

  // Scroll to end when keyboard shows
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim() || !currentUser) return;

    await addDoc(collection(db, "messages"), {
      text,
      senderId: currentUser.uid,
      receiverId: selectedUser.id,
      participants: [currentUser.uid, selectedUser.id],
      createdAt: serverTimestamp(),
      read: false,
    });

    setText("");

    // Scroll to end after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleAttachment = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Take Photo",
            "Choose from Library",
            "Choose Document",
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          } else if (buttonIndex === 3) {
            pickDocument();
          }
        }
      );
    } else {
      // Android - show custom options
      setShowOptions(true);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
    setShowOptions(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        await sendDocumentMessage(result.assets[0]);
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to pick document");
    }
    setShowOptions(false);
  };

  const uploadToCloudinary = async (uri: string) => {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: `chat_${Date.now()}.jpg`,
    } as any);
    data.append("upload_preset", "waste_food_management");
    data.append("cloud_name", "dhdutbou0");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dhdutbou0/image/upload",
      { method: "POST", body: data }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Upload failed");
    return json.secure_url;
  };

  const sendImageMessage = async (uri: string) => {
    if (!currentUser) return;

    try {
      const imageUrl = await uploadToCloudinary(uri);

      await addDoc(collection(db, "messages"), {
        text: "📷 Photo",
        imageUrl,
        senderId: currentUser.uid,
        receiverId: selectedUser.id,
        participants: [currentUser.uid, selectedUser.id],
        createdAt: serverTimestamp(),
        read: false,
      });
    } catch (error) {
      console.error("Send image error:", error);
      Alert.alert("Error", "Failed to send image");
    }
  };

  const sendDocumentMessage = async (document: any) => {
    if (!currentUser) return;

    await addDoc(collection(db, "messages"), {
      text: `📎 ${document.name}`,
      fileName: document.name,
      fileType: document.mimeType,
      senderId: currentUser.uid,
      receiverId: selectedUser.id,
      participants: [currentUser.uid, selectedUser.id],
      createdAt: serverTimestamp(),
      read: false,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.senderId === currentUser?.uid;

    return (
      <View
        style={[
          styles.messageWrapper,
          isSender ? styles.senderWrapper : styles.receiverWrapper,
        ]}
      >
        {!isSender && (
          <Image
            source={{ uri: selectedUser.avatar || defaultAvatar }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageContainer,
            isSender ? styles.sender : styles.receiver,
          ]}
        >
          {item.imageUrl ? (
            <TouchableOpacity activeOpacity={0.9}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : null}

          {item.fileName ? (
            <View style={styles.documentContainer}>
              <Ionicons
                name="document-outline"
                size={24}
                color={isSender ? "#FFF" : "#7C3AED"}
              />
              <Text
                style={[
                  styles.documentText,
                  isSender ? styles.senderText : styles.receiverText,
                ]}
                numberOfLines={1}
              >
                {item.fileName}
              </Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.messageText,
              isSender ? styles.senderText : styles.receiverText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isSender ? styles.timestampSender : styles.timestampReceiver,
            ]}
          >
            {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={64}
          color="#D1D5DB"
        />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        {`Start the conversation by sending a message to ${selectedUser.name}`}
      </Text>
      <View style={styles.wavingHandContainer}>
        <Text style={styles.wavingHand}>👋</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerUserInfo}>
          <Image
            source={{ uri: selectedUser.avatar || defaultAvatar }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{selectedUser.name}</Text>
            <Text style={styles.headerEmail}>{selectedUser.email}</Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      {messages.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input Container */}
      <View style={styles.inputWrapper}>
        {showOptions && Platform.OS === "android" && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#7C3AED" />
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
              <Ionicons name="image" size={24} color="#7C3AED" />
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={pickDocument}
            >
              <Ionicons name="document" size={24} color="#7C3AED" />
              <Text style={styles.optionText}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowOptions(false)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text style={styles.optionText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachment}
          >
            <Ionicons name="add-circle" size={28} color="#7C3AED" />
          </TouchableOpacity>

          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            style={styles.input}
            multiline
            maxLength={1000}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              !text.trim() && styles.sendButtonDisabled,
            ]}
            disabled={!text.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={text.trim() ? "#FFF" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },
  headerEmail: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageWrapper: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  senderWrapper: {
    justifyContent: "flex-end",
  },
  receiverWrapper: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageContainer: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sender: {
    backgroundColor: "#7C3AED",
    borderBottomRightRadius: 4,
    marginLeft: "auto",
  },
  receiver: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  senderText: {
    color: "#FFF",
  },
  receiverText: {
    color: "#111827",
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  timestampSender: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  timestampReceiver: {
    color: "#9CA3AF",
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  wavingHandContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  wavingHand: {
    fontSize: 40,
  },
  inputWrapper: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 8,
    maxHeight: 100,
    fontWeight: "500",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  documentText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 8,
    borderRadius: 12,
  },
  optionButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  optionText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});
