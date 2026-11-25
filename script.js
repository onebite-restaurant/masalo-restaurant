
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set
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

// ग्राहक का ऑर्डर Firebase में भेजना
async function placeOrder(order) {
  const orderRef = push(ref(database, "orders"));

  await set(orderRef, {
    customerName: order.customerName,
    phone: order.phone,
    items: order.items,
    status: "Pending",
    createdAt: Date.now()
  });

  return orderRef.key;
}

// Admin लॉगिन
async function adminLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Admin लॉगआउट
async function adminLogout() {
  return signOut(auth);
}

// दूसरे पेजों के लिए उपलब्ध कराना
window.MASALO = {
  placeOrder,
  adminLogin,
  adminLogout,
  auth,
  database
};
