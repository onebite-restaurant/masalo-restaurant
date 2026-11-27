
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

/* MASALO Firebase Configuration */

const firebaseConfig = {
  apiKey: "AIzaSyAxTtHQBZZtHB3-vWNFcJqjvTTqqTdO1gM",
  authDomain: "masalo-6abad.firebaseapp.com",
  databaseURL: "https://masalo-6abad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "masalo-6abad",
  storageBucket: "masalo-6abad.firebasestorage.app",
  messagingSenderId: "762877990171",
  appId: "1:762877990171:web:90b33a47650e644ccaefbe"
};

/* Firebase Initialize */

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

/* Tracking Code Generate */

function createTrackingCode() {
  const bytes = new Uint8Array(16);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* Payment Method Validate */

function normalizePaymentMethod(value) {
  const method = String(value || "").trim().toLowerCase();

  if (method === "cash") {
    return "Cash";
  }

  if (method === "upi") {
    return "UPI";
  }

  if (method === "other") {
    return "Other";
  }

  throw new Error("कृपया Cash, UPI या Other में से भुगतान तरीका चुनें।");
}

/* Place Customer Order */

async function placeOrder(order) {
  const customerName = String(order.customerName || "").trim();
  const phone = String(order.phone || "").trim();
  const tableNumber = Number(order.tableNumber);
  const total = Number(order.total);

  if (!customerName) {
    throw new Error("अपना नाम लिखें।");
  }

  if (!/^[0-9+\-\s()]{10,15}$/.test(phone)) {
    throw new Error("सही मोबाइल नंबर लिखें।");
  }

  if (
    !Number.isInteger(tableNumber) ||
    tableNumber < 1 ||
    tableNumber > 20
  ) {
    throw new Error("सही टेबल नंबर चुनें।");
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Cart खाली है।");
  }

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("ऑर्डर का कुल बिल सही नहीं है।");
  }

  const paymentMethod = normalizePaymentMethod(order.paymentMethod);

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
    totalAmount: total,
    tableNumber,
    tableLabel: "Table " + tableNumber,
    paymentMethod,
    trackingCode
  };

  /* Save Order */

  await set(orderRef, orderData);

  /* Save Tracking Information */

  await set(
    ref(database, "tracking/" + trackingCode),
    {
      status: "Pending",
      tableNumber,
      createdAt,
      total,
      trackingCode
    }
  );

  return {
    orderId: orderRef.key,
    trackingCode,
    tableNumber,
    total,
    paymentMethod
  };
}

/* Table Service Request */

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

  if (
    !Number.isInteger(table) ||
    table < 1 ||
    table > 20
  ) {
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

/* Customer Table Bill Listener */

function listenTableBill(tableNumber, callback) {
  const table = Number(tableNumber);

  if (
    !Number.isInteger(table) ||
    table < 1 ||
    table > 20
  ) {
    throw new Error("सही टेबल नंबर चुनें।");
  }

  return onValue(
    ref(database, "tableBills/" + table),
    snapshot => {
      callback(snapshot.exists() ? snapshot.val() : null);
    }
  );
}

/* Order Tracking */

function trackOrder(trackingCode, callback) {
  if (!/^[a-f0-9]{32}$/i.test(trackingCode)) {
    throw new Error("Tracking Code सही नहीं है।");
  }

  return onValue(
    ref(database, "tracking/" + trackingCode),
    snapshot => {
      callback(snapshot.exists() ? snapshot.val() : null);
    }
  );
}

/* Admin Login */

async function adminLogin(email, password) {
  const result = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (
    result.user.uid !== "HVSDW4Otl9Mf1WZJ6REMk7jATqu1"
  ) {
    await signOut(auth);

    throw new Error("आप MASALO Admin नहीं हैं।");
  }

  return result;
}

/* Admin Logout */

async function adminLogout() {
  return signOut(auth);
}

/* MASALO Global Functions */

window.MASALO = {
  database,
  auth,
  placeOrder,
  requestService,
  listenTableBill,
  trackOrder,
  adminLogin,
  adminLogout
};

console.log("MASALO Firebase connected successfully.");
