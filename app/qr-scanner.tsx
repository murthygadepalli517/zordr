import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../context/StoreContext';

export default function QRScannerScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { authToken } = useStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, []);
const handleBarCodeScanned = async ({ data }: any) => {
  if (scanned || verifying) {
    console.log("⚠️ Ignored scan (already scanning or verifying)");
    return;
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📷 STEP 1: QR SCANNED");
  console.log("Raw QR Data:", data);
  console.log("Route orderId:", orderId);
  console.log("Auth Token exists:", !!authToken);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  setScanned(true);
  setVerifying(true);

  try {
    // ===============================
    // STEP 2: PARSE QR
    // ===============================
    console.log("🔍 STEP 2: Parsing QR");

    const parts = data.split('|');
    console.log("Split parts:", parts);

    if (parts.length !== 3 || parts[0] !== 'PICKUP') {
      console.log("❌ Invalid QR format detected");
      throw new Error("Invalid QR format");
    }

    // const qrOrderId = parts[1];
    // const qrPickupToken = parts[2];

    const qrPickupToken = parts[2]; // keep pickup token from QR

if (!orderId) {
  throw new Error("Missing current order ID");
}


    console.log(" OrderId:", orderId);
    console.log("Extracted qrPickupToken:", qrPickupToken);

    // ===============================
    // STEP 3: PREPARE REQUEST BODY
    // ===============================
    const requestBody = {
      orderId: orderId,
      pickupToken: qrPickupToken,
    };

    console.log("\n📦 STEP 3: Request Body");
    console.log(JSON.stringify(requestBody, null, 2));

    console.log("\n📡 STEP 4: Sending API Request");
    console.log("URL:", "https://zordr-backend.onrender.com/api/pickup/verify-scan");
    console.log("Headers:", {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    });

    // ===============================
    // STEP 4: API CALL
    // ===============================
    const response = await fetch(
      "https://zordr-backend.onrender.com/api/pickup/verify-scan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("\n📡 STEP 5: Response Received");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    console.log("Status Text:", response.statusText);

    // ===============================
    // STEP 6: READ RAW RESPONSE
    // ===============================
    const rawText = await response.text();

    console.log("\n📄 STEP 6: Raw Response Text");
    console.log(rawText);

    let responseData;

    try {
      responseData = JSON.parse(rawText);
      console.log("\n🧠 STEP 7: Parsed JSON Response");
      console.log(JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log("❌ JSON Parse Failed");
      throw new Error("Server returned invalid JSON");
    }

    // ===============================
    // STEP 8: HANDLE SERVER LOGIC
    // ===============================
    if (!response.ok) {
      console.log("❌ Server returned error status");
      throw new Error(responseData?.message || "Server rejected request");
    }

    if (responseData?.success) {
      console.log("🎉 STEP 9: Verification SUCCESS");
      console.log("Navigating to success screen...");
      router.replace("/pickup-success");
    } else {
      console.log("❌ STEP 9: Verification FAILED");
      throw new Error(responseData?.message || "Verification failed");
    }

  } catch (error: any) {
    console.log("\n❌ ERROR OCCURRED");
    console.log("Error Type:", typeof error);
    console.log("Error Object:", error);
    console.log("Error Message:", error?.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (error?.message?.includes("Too early")) {
      Alert.alert("Pickup Not Open Yet ⏰", error.message);
    } else {
      Alert.alert("Verification Failed", error?.message || "Unknown error");
    }

    setScanned(false);
  } finally {
    console.log("🔄 FINAL STEP: Cleanup");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    setVerifying(false);
  }
};


  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {verifying && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={{ color: '#fff', marginTop: 10 }}>
            Verifying order...
          </Text>
        </View>
      )}

      {/* HEADER */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Order QR</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom instructions */}
      <View style={styles.bottomSection}>
        <Text style={styles.instructionText}>
          Position QR code within the frame
        </Text>
        <Text style={styles.subText}>
          The order will be confirmed after successful scan
        </Text>
      </View>
    </View>
  );
}


const FRAME_SIZE = 250;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#f97316',
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '100%',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanningFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '100%',
  },
  corner: {
    position: 'absolute',
    borderColor: '#f97316',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },

  loadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 20,
},

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 60,
    paddingTop: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
