import { auth, db } from "@/configs/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  DocumentData,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

interface Post {
  id: string;
  foodName: string;
  useTime: string;
  quantity: string | number;
  imageUrl: string;
  description?: string;
  pickupGuidelines?: string;
  status: "pending" | "accepted" | "pickup" | "inTransit" | "donated";

  // Timestamps
  createdAt?: any;
  acceptedAt?: any;
  pickedUpAt?: any;
  inTransitAt?: any;
  donatedAt?: any;
  updatedAt?: any;

  createdBy?: {
    uid?: string | null;
    isAnonymous?: boolean;
    email?: string | null;
    name?: string;
    phone?: string;
  };
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  ngoDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    uid?: string | null;
    isAnonymous?: boolean;
  };
  pickupDetails?: {
    date?: string;
    time?: string;
    address?: string;
  };
  donatedDetails?: {
    date?: string;
    ngoName?: string;
    receivedBy?: string;
  };
}

interface UserData {
  fullName?: string;
  uid?: string;
  isAnonymous?: boolean;
  email?: string;
  role?: string;
}

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [item, setItem] = useState<Post | null>(
    params.item ? JSON.parse(params.item as string) : null
  );

  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentAuthUser = auth.currentUser;

  const fetchFoodDetails = async (foodId: string): Promise<Post | null> => {
    try {
      const docRef = doc(db, "foods", foodId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return null;

      const data = snap.data() as DocumentData;

      return {
        id: snap.id,
        foodName: data.foodName ?? "",
        useTime: data.useTime ?? "",
        quantity: data.quantity ?? "",
        imageUrl: data.imageUrl ?? "",
        description: data.description ?? "",
        pickupGuidelines: data.pickupGuidelines ?? "",
        status: data.status ?? "pending",

        createdAt: data.createdAt,
        acceptedAt: data.acceptedAt,
        pickedUpAt: data.pickedUpAt,
        inTransitAt: data.inTransitAt,
        donatedAt: data.donatedAt,
        updatedAt: data.updatedAt,

        createdBy: data.createdBy ?? {},
        location: data.location ?? {},
        ngoDetails: data.ngoDetails ?? {},
        pickupDetails: data.pickupDetails ?? {},
        donatedDetails: data.donatedDetails ?? {},
      };
    } catch (err) {
      console.error("Error fetching food details:", err);
      return null;
    }
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (!item?.id) return;
      const latest = await fetchFoodDetails(item.id);
      if (latest) setItem(latest);
    };

    loadDetails();
  }, []);

  // Fetch user data
  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        if (!currentAuthUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        const userDoc = await getDoc(doc(db, "users", currentAuthUser.uid));
        if (mounted && userDoc.exists()) {
          setUser(userDoc.data() as UserData);
        } else {
          setUser({
            uid: currentAuthUser.uid,
            email: currentAuthUser.email || undefined,
            isAnonymous: currentAuthUser.isAnonymous || false,
          });
        }
      } catch (err) {
        console.error("fetchUser error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, [currentAuthUser]);

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
        <Text style={styles.errorText}>No food item found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Available",
          color: "#9333EA",
          bg: "#F3E8FF",
          icon: "checkmark-circle-outline",
        };
      case "accepted":
        return {
          label: "Accepted",
          color: "#3B82F6",
          bg: "#DBEAFE",
          icon: "hand-right-outline",
        };
      case "pickup":
        return {
          label: "Pickup",
          color: "#EC4899",
          bg: "#FCE7F3",
          icon: "car-outline",
        };
      case "inTransit":
        return {
          label: "In Transit",
          color: "#F59E0B",
          bg: "#FFF7ED",
          icon: "car-outline",
        };
      case "donated":
        return {
          label: "Completed",
          color: "#10B981",
          bg: "#D1FAE5",
          icon: "heart-outline",
        };
      default:
        return {
          label: "Unknown",
          color: "#6B7280",
          bg: "#F3F4F6",
          icon: "help-circle-outline",
        };
    }
  };

  const statusConfig = getStatusConfig(item.status);

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "N/A";

    let date: Date;

    try {
      // Check if it's a Firestore Timestamp with toDate method
      if (timestamp?.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      }
      // Check if it's a plain object with seconds (including the type property from your data)
      else if (
        typeof timestamp === "object" &&
        "seconds" in timestamp &&
        typeof timestamp.seconds === "number"
      ) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Check if it's already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Check if it's a string
      else if (typeof timestamp === "string") {
        date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp;
      }
      // Check if it's a number (unix timestamp)
      else if (typeof timestamp === "number") {
        date = new Date(timestamp * 1000);
      } else {
        console.warn("Unknown timestamp format:", timestamp);
        return "Invalid date";
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn("Invalid date created from:", timestamp);
        return "Invalid date";
      }

      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return "Invalid date";
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleOpenMap = () => {
    if (item.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`;
      Linking.openURL(url);
    }
  };

  const updateStatus = async (newStatus: Post["status"], toastText: string) => {
    try {
      setUpdating(true);
      const postRef = doc(db, "foods", item.id);

      const updatePayload: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      if (newStatus === "donated") {
        updatePayload.donatedAt = Timestamp.now();
      }
      if (newStatus === "pickup") {
        updatePayload.pickedUpAt = Timestamp.now();
      }
      if (newStatus === "inTransit") {
        updatePayload.inTransitAt = Timestamp.now();
      }
      if (newStatus === "accepted") {
        updatePayload.ngoDetails = {
          uid: user?.uid ?? currentAuthUser?.uid ?? null,
          isAnonymous:
            user?.isAnonymous ?? currentAuthUser?.isAnonymous ?? false,
          email: user?.email ?? currentAuthUser?.email ?? null,
          name: user?.fullName ?? undefined,
        };
        updatePayload.acceptedAt = Timestamp.now();
      }

      await updateDoc(postRef, updatePayload);

      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: toastText,
      });

      setItem((prev) => ({
        ...prev,
        status: newStatus,
        ...updatePayload,
      }));
    } catch (err: any) {
      console.error("updateStatus error:", err);
      Toast.show({
        type: "error",
        text1: "Error updating status",
        text2: err?.message ?? "Unknown error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAccept = () => {
    Alert.alert(
      "Accept Donation",
      "Are you sure you want to accept this food donation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () =>
            updateStatus("accepted", "You have accepted this food request."),
        },
      ]
    );
  };

  const handlePickup = () => {
    Alert.alert(
      "Mark as Picked Up",
      "Confirm that the food has been picked up?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateStatus("pickup", "Food is now marked as picked up."),
        },
      ]
    );
  };

  const handleInTransit = () => {
    Alert.alert("Mark In Transit", "Mark this food as in transit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          updateStatus("inTransit", "Food is now marked as in transit."),
      },
    ]);
  };

  const handleDonated = () => {
    Alert.alert(
      "Mark as Donated",
      "Confirm that this food has been successfully donated?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateStatus("donated", "This food has been successfully donated."),
        },
      ]
    );
  };

  const currentUid = user?.uid ?? currentAuthUser?.uid ?? null;
  const currentRole = user?.role ?? null;

  const getActionButton = () => {
    const { status, ngoDetails, createdBy } = item;

    // NGO can accept pending items
    if (status === "pending" && currentRole === "ngo") {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#9333EA" }]}
          onPress={handleAccept}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="hand-right-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Accept Donation</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // Donor can mark as picked up after acceptance
    if (
      status === "accepted" &&
      currentRole === "donor" &&
      currentUid &&
      createdBy?.uid === currentUid
    ) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#EC4899" }]}
          onPress={handlePickup}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="cube-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // NGO can mark as in transit after pickup
    if (
      status === "pickup" &&
      currentRole === "ngo" &&
      currentUid &&
      ngoDetails?.uid === currentUid
    ) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
          onPress={handleInTransit}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="car-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Mark In Transit</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // NGO can mark as donated when in transit
    if (
      status === "inTransit" &&
      currentRole === "ngo" &&
      currentUid &&
      ngoDetails?.uid === currentUid
    ) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#10B981" }]}
          onPress={handleDonated}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-done-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Mark as Donated</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const actionButton = getActionButton();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadgeTop,
              { backgroundColor: statusConfig.bg },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={16}
              color={statusConfig.color}
            />
            <Text style={[styles.statusTextTop, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{item.foodName}</Text>
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
          </View>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Best Before</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {formatTimestamp(item.useTime)}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>{item.quantity}</Text>
              </View>
            </View>
          </View>

          {/* Donor Information */}
          {item.createdBy && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#DBEAFE" }]}
                  >
                    <Ionicons name="person" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.cardTitle}>Donor Information</Text>
                </View>
              </View>

              <View style={styles.detailsList}>
                {!item?.createdBy?.isAnonymous && item.createdBy.name && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Donor Name</Text>
                      <Text style={styles.detailValue}>
                        {item?.createdBy?.name}
                      </Text>
                    </View>
                  </View>
                )}

                {item?.createdBy?.isAnonymous && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="eye-off-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Donor</Text>
                      <Text style={styles.detailValue}>Anonymous Donor</Text>
                    </View>
                  </View>
                )}

                {item.createdBy.email && !item.createdBy.isAnonymous && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="mail-outline" size={18} color="#6B7280" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <TouchableOpacity
                        onPress={() => handleEmail(item.createdBy!.email!)}
                      >
                        <Text style={styles.detailLink}>
                          {item.createdBy.email}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {item.createdAt && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="time-outline" size={18} color="#6B7280" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Posted On</Text>
                      <Text style={styles.detailValue}>
                        {formatTimestamp(item?.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {!item.createdBy.isAnonymous && item.createdBy.email && (
                <View style={styles.contactActions}>
                  {item.createdBy?.phone && (
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCall(item.createdBy!.phone!)}
                    >
                      <Ionicons name="call" size={18} color="#3B82F6" />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleEmail(item.createdBy!.email!)}
                  >
                    <Ionicons name="mail" size={18} color="#3B82F6" />
                    <Text style={styles.contactBtnText}>Email</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Location */}
          {item.location && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#FCE7F3" }]}
                  >
                    <Ionicons name="location" size={24} color="#EC4899" />
                  </View>
                  <Text style={styles.cardTitle}>Pickup Location</Text>
                </View>
              </View>

              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#6B7280"
                    />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>
                      {item.location.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons
                      name="navigate-outline"
                      size={18}
                      color="#6B7280"
                    />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Coordinates</Text>
                    <Text style={styles.detailValue}>
                      {item.location.latitude.toFixed(6)},{" "}
                      {item.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleOpenMap}
              >
                <Ionicons name="map" size={18} color="#EC4899" />
                <Text style={styles.mapButtonText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status Timeline */}
          {item.status !== "pending" && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#F3E8FF" }]}
                  >
                    <MaterialIcons name="timeline" size={24} color="#9333EA" />
                  </View>
                  <Text style={styles.cardTitle}>Donation Timeline</Text>
                </View>
              </View>

              <View style={styles.timelineContainer}>
                {/* Created */}
                {item.createdAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconWrapper}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: "#10B981" },
                        ]}
                      />
                      <View style={styles.timelineLine} />
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Ionicons name="add-circle" size={16} color="#10B981" />
                        <Text
                          style={[styles.timelineTitle, { color: "#10B981" }]}
                        >
                          Food Posted
                        </Text>
                      </View>
                      <Text style={styles.timelineDate}>
                        {formatTimestamp(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Accepted */}
                {item?.acceptedAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconWrapper}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: "#3B82F6" },
                        ]}
                      />
                      {(item?.pickedUpAt ||
                        item?.inTransitAt ||
                        item?.donatedAt) && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Ionicons name="hand-right" size={16} color="#3B82F6" />
                        <Text
                          style={[styles.timelineTitle, { color: "#3B82F6" }]}
                        >
                          Accepted by NGO
                        </Text>
                      </View>
                      <Text style={styles.timelineDate}>
                        {formatTimestamp(item.acceptedAt)}
                      </Text>
                      {item.ngoDetails?.name && (
                        <Text style={styles.timelineSubtext}>
                          {item.ngoDetails.name}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Picked Up */}
                {item.pickedUpAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconWrapper}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: "#EC4899" },
                        ]}
                      />
                      {(item.inTransitAt || item.donatedAt) && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Ionicons name="cube" size={16} color="#EC4899" />
                        <Text
                          style={[styles.timelineTitle, { color: "#EC4899" }]}
                        >
                          Picked Up
                        </Text>
                      </View>
                      <Text style={styles.timelineDate}>
                        {formatTimestamp(item.pickedUpAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* In Transit */}
                {item.inTransitAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconWrapper}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: "#F59E0B" },
                        ]}
                      />
                      {item.donatedAt && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Ionicons name="car" size={16} color="#F59E0B" />
                        <Text
                          style={[styles.timelineTitle, { color: "#F59E0B" }]}
                        >
                          In Transit
                        </Text>
                      </View>
                      <Text style={styles.timelineDate}>
                        {formatTimestamp(item.inTransitAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Donated */}
                {item.donatedAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconWrapper}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: "#10B981" },
                        ]}
                      />
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Ionicons name="heart" size={16} color="#10B981" />
                        <Text
                          style={[styles.timelineTitle, { color: "#10B981" }]}
                        >
                          Successfully Donated
                        </Text>
                      </View>
                      <Text style={styles.timelineDate}>
                        {formatTimestamp(item.donatedAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {item.ngoDetails &&
            (item.status === "accepted" ||
              item.status === "pickup" ||
              item.status === "inTransit" ||
              item.status === "donated") && (
              <View style={styles.detailsCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[styles.cardIcon, { backgroundColor: "#D1FAE5" }]}
                    >
                      <Ionicons name="business" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.cardTitle}>NGO Details</Text>
                  </View>
                </View>

                <View style={styles.detailsList}>
                  {item.ngoDetails.name && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconWrapper}>
                        <Ionicons
                          name="business-outline"
                          size={18}
                          color="#6B7280"
                        />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Organization</Text>
                        <Text style={styles.detailValue}>
                          {item.ngoDetails.name}
                        </Text>
                      </View>
                    </View>
                  )}

                  {item.ngoDetails.email && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconWrapper}>
                        <Ionicons
                          name="mail-outline"
                          size={18}
                          color="#6B7280"
                        />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <TouchableOpacity
                          onPress={() => handleEmail(item.ngoDetails!.email!)}
                        >
                          <Text style={styles.detailLink}>
                            {item.ngoDetails.email}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {item.ngoDetails.phone && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconWrapper}>
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color="#6B7280"
                        />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <TouchableOpacity
                          onPress={() => handleCall(item.ngoDetails!.phone!)}
                        >
                          <Text style={styles.detailLink}>
                            {item.ngoDetails.phone}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {item.ngoDetails.email && (
                  <View style={styles.contactActions}>
                    {item.ngoDetails.phone && (
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => handleCall(item.ngoDetails!.phone!)}
                      >
                        <Ionicons name="call" size={18} color="#10B981" />
                        <Text style={styles.contactBtnText}>Call NGO</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleEmail(item.ngoDetails!.email!)}
                    >
                      <Ionicons name="mail" size={18} color="#10B981" />
                      <Text style={styles.contactBtnText}>Email NGO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          {item.pickupGuidelines && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#FEF3C7" }]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color="#F59E0B"
                    />
                  </View>
                  <Text style={styles.cardTitle}>Pickup Guidelines</Text>
                </View>
              </View>

              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: "#FEF3C7", marginTop: 0 },
                ]}
              >
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text style={[styles.alertText, { color: "#F59E0B" }]}>
                  {item.pickupGuidelines}
                </Text>
              </View>
            </View>
          )}
          {item.status === "donated" && (
            <View style={[styles.alertBox, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="heart-circle" size={24} color="#10B981" />
              <Text
                style={[styles.alertText, { color: "#10B981", fontSize: 14 }]}
              >
                Thank you for your generous donation! This food has been
                successfully delivered and will help those in need.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {actionButton && <View style={styles.actionBar}>{actionButton}</View>}

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 40,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: width,
    height: width * 0.8,
    backgroundColor: "#E5E7EB",
    objectFit: "contain",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backButton: {
    position: "absolute",
    top: 44,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeTop: {
    position: "absolute",
    top: 44,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusTextTop: {
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  detailsList: {
    gap: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  detailLink: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  contactActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3B82F6",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCE7F3",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EC4899",
  },
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 20,
  },
  timelineIconWrapper: {
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: "#E5E7EB",
    position: "absolute",
    top: 12,
    left: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  timelineDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  timelineSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    fontStyle: "italic",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  guidelinesList: {
    gap: 10,
  },
  guidelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  guidelineBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  guidelineText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  retryButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
