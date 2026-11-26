
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxTtHQBZZtHB3-vWNFcJqjvTTqqTdO1gM",
  authDomain: "masalo-6abad.firebaseapp.com",
  databaseURL: "https://masalo-6abad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "masalo-6abad",
  storageBucket: "masalo-6abad.firebasestorage.app",
  messagingSenderId: "762877990171",
  appId: "1:762877990171:web:90b33a47650e644ccaefbe"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function createTrackingCode() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

// ग्राहक का ऑर्डर
async function placeOrder(order) {
  const customerName = String(order.customerName || "").trim();
  const phone = String(order.phone || "").trim();
  const tableNumber = Number(order.tableNumber);
  const total = Number(order.total);

  if (!customerName) {
    throw new Error("अपना नाम लिखें।");
  }

  if (phone.length < 10 || phone.length > 15) {
    throw new Error("सही मोबाइल नंबर लिखें।");
  }

  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 20) {
    throw new Error("सही टेबल नंबर चुनें।");
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Cart खाली है।");
  }

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("ऑर्डर का कुल बिल सही नहीं है।");
  }

  const trackingCode = createTrackingCode();
  const orderRef = push(ref(database, "orders"));
  const createdAt = Date.now();

  const orderData = {
    customerName,
    phone,
    items: order.items,
    status: "Pending",
    createdAt,
    total,
    tableNumber,
    trackingCode
  };

  await set(orderRef, orderData);

  await set(ref(database, "tracking/" + trackingCode), {
    status: "Pending",
    tableNumber,
    createdAt,
    total
  });

  return {
    orderId: orderRef.key,
    trackingCode,
    tableNumber,
    total
  };
}

// टेबल सर्विस रिक्वेस्ट
async function requestService(type, tableNumber) {
  const allowedTypes = [
    "Call Waiter",
    "Water Please",
    "Request Bill",
    "Other Help"
  ];

  const table = Number(tableNumber);

  if (!allowedTypes.includes(type)) {
    throw new Error("गलत सर्विस रिक्वेस्ट।");
  }

  if (!Number.isInteger(table) || table < 1 || table > 20) {
    throw new Error("सही टेबल नंबर चुनें।");
  }

  const requestRef = push(ref(database, "serviceRequests"));

  await set(requestRef, {
    type,
    tableNumber: table,
    status: "Pending",
    createdAt: Date.now()
  });

  return requestRef.key;
}

// ऑर्डर ट्रैक करना
function trackOrder(trackingCode, callback) {
  if (!/^[a-f0-9]{32}$/i.test(trackingCode)) {
    throw new Error("Tracking Code सही नहीं है।");
  }

  const trackingRef = ref(database, "tracking/" + trackingCode);

  return onValue(trackingRef, snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
}

// Admin लॉगिन
async function adminLogin(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);

  if (result.user.uid !== "HVSDW4Otl9Mf1WZJ6REMk7jATqu1") {
    await signOut(auth);
    throw new Error("आप MASALO Admin नहीं हैं।");
  }

  return result;
}

// Admin लॉगआउट
async function adminLogout() {
  return signOut(auth);
}

// सभी पेजों के लिए फ़ंक्शन उपलब्ध
window.MASALO = {
  database,
  auth,
  placeOrder,
  requestService,
  trackOrder,
  adminLogin,
  adminLogout
};

console.log("MASALO Firebase connected successfully.");
