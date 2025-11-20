import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

interface ProposeDateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dates: string[]) => void;
  title?: string;
}

export default function ProposeDateModal({
  visible,
  onClose,
  onSubmit,
  title,
}: ProposeDateModalProps) {
  // Initialize with dates 1, 2, 3 days from now at 00:01
  const getInitialDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(0, 1, 0, 0); // Set to 00:01
    return date;
  };

  const [selectedDates, setSelectedDates] = useState<Date[]>([
    getInitialDate(1),
    getInitialDate(2),
    getInitialDate(3),
  ]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Handle Android dismiss
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      setCurrentDateIndex(null);
      return;
    }

    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate && currentDateIndex !== null) {
      // Set time to 00:01
      selectedDate.setHours(0, 1, 0, 0);
      
      const newDates = [...selectedDates];
      newDates[currentDateIndex] = selectedDate;
      setSelectedDates(newDates);

      if (Platform.OS === "android") {
        setCurrentDateIndex(null);
      }
    }
  };

  const openDatePicker = (index: number) => {
    setCurrentDateIndex(index);
    setShowPicker(true);
  };

  const handleSubmit = () => {
    const formattedDates = selectedDates.map((date) => date.toISOString());
    onSubmit(formattedDates);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Get minimum date (tomorrow)
  const getMinimumDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  };

  // Get maximum date (7 days from transaction date)
  const getMaximumDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(23, 59, 59, 999);
    return maxDate;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title || "Đề xuất lịch hẹn"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.instruction}>
              Vui lòng chọn 3 ngày bạn có thể gặp (từ ngày mai đến ngày thứ 7 sau khi đặt cọc). Bên còn lại sẽ chọn 1
              trong 3 ngày hoặc đề xuất ngày khác.
            </Text>

            {selectedDates.map((date, index) => (
              <View key={index} style={styles.dateItem}>
                <Text style={styles.dateLabel}>Lựa chọn {index + 1}:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => openDatePicker(index)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#3498db" />
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {showPicker && currentDateIndex !== null && (
              <DateTimePicker
                value={selectedDates[currentDateIndex]}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                minimumDate={getMinimumDate()}
                maximumDate={getMaximumDate()}
                locale="vi-VN"
              />
            )}

            {Platform.OS === "ios" && showPicker && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.doneButtonText}>Xong</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Gửi đề xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  instruction: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 20,
    lineHeight: 20,
  },
  dateItem: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ecf0f1",
  },
  dateText: {
    fontSize: 14,
    color: "#2c3e50",
    marginLeft: 10,
    flex: 1,
  },
  doneButton: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ecf0f1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
