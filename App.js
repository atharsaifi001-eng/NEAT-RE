// App.js — NEAT Real Estate (Single file, Expo-ready)
// Run: npx expo start

import React, { useEffect, useState, useMemo, createContext, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* ---------------- ASSETS ---------------- */
const ASSETS = {
  // Prefer a square logo. You can replace with a local file require if you want.
  logo: "https://i.imgur.com/3G2Z6mL.png",
  avatar: "https://i.pravatar.cc/120?img=12",
  placeholder: "https://picsum.photos/seed/neat/200/200",
};

/* ---------------- THEME ---------------- */
const COLORS = {
  primary: "#2E78B6",
  accent: "#8DB330",
  light: "#F6F6F6",
  dark: "#444444",
  white: "#FFFFFF",
  muted: "#9AA0A6",
  danger: "#E74C3C",
};
const RADIUS = 14;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  topBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 10,
  },
  btnPrimary: { backgroundColor: COLORS.primary, padding: 12, borderRadius: RADIUS, alignItems: "center" },
  btnAccent: { backgroundColor: COLORS.accent, padding: 12, borderRadius: RADIUS, alignItems: "center" },
  btnText: { color: COLORS.white, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: COLORS.light },
  pill: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
});

/* ---------------- MOCK DB & API ---------------- */
const MockDB = {
  users: [],
  listings: [
    {
      id: "L-1001",
      title: "3 BHK House — Prime Area",
      description: "Spacious 3 BHK with modern kitchen, near metro. Clear title.",
      price: 8500000,
      areaGaz: 250,
      front: 25,
      roadWidth: 30,
      category: "House",
      media: [{ type: "image", uri: "https://picsum.photos/seed/house1/800/500" }],
      location: { state: "UP", city: "Noida", area: "Sector 62", lat: 28.629, lng: 77.372 },
      dealerId: "U-2001",
      sellerId: "U-3001",
      boosted: true,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: "L-1002",
      title: "Commercial Plot — Highway Facing",
      description: "Great frontage and highway access. Ideal for showroom.",
      price: 13500000,
      areaGaz: 500,
      front: 40,
      roadWidth: 60,
      category: "Commercial",
      media: [{ type: "image", uri: "https://picsum.photos/seed/plot2/800/500" }],
      location: { state: "RJ", city: "Jaipur", area: "Ajmer Rd", lat: 26.912, lng: 75.787 },
      dealerId: "U-2002",
      sellerId: "U-3002",
      boosted: false,
      createdAt: Date.now() - 86400000 * 6,
    },
  ],
  chats: {},
  leads: [],
  documents: [],
  commissions: [],
  visits: [],
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const api = {
  sendOtp: async (identifier) => {
    await delay(250);
    return { success: true, code: "123456" };
  },
  verifyOtp: async ({ identifier, code }) => {
    await delay(150);
    return code === "123456";
  },
  loginOrRegister: async ({ identifier, role }) => {
    await delay(150);
    let user = MockDB.users.find((u) => u.identifier === identifier);
    if (!user) {
      user = {
        id: "U-" + Math.floor(Math.random() * 100000),
        identifier,
        role,
        name: role + " " + identifier,
        ratings: [],
        kycStatus: "pending",
        serviceAreas: ["110001"],
      };
      MockDB.users.push(user);
    }
    return user;
  },
  listProperties: async (filters) => {
    await delay(200);
    let results = [...MockDB.listings];
    if (filters?.query) results = results.filter((l) => l.title.toLowerCase().includes((filters.query || "").toLowerCase()));
    if (filters?.category && filters.category !== "All") results = results.filter((l) => l.category === filters.category);
    if (filters?.city) results = results.filter((l) => l.location.city === filters.city);
    if (filters?.budgetMin) results = results.filter((l) => l.price >= filters.budgetMin);
    if (filters?.budgetMax) results = results.filter((l) => l.price <= filters.budgetMax);
    return results.sort((a, b) => (b.boosted === a.boosted ? b.createdAt - a.createdAt : b.boosted - a.boosted));
  },
  createListing: async (payload) => {
    await delay(250);
    const id = "L-" + Math.floor(Math.random() * 100000);
    MockDB.listings.push({ id, createdAt: Date.now(), boosted: false, ...payload });
    MockDB.leads.push({
      id: "LEAD-" + Math.floor(Math.random() * 100000),
      listingId: id,
      fromUserId: null,
      toUserId: payload.dealerId || payload.sellerId,
      source: "Manual",
      status: "new",
      at: Date.now(),
    });
    return id;
  },
  toggleBoost: async (listingId, value) => {
    await delay(100);
    const i = MockDB.listings.findIndex((l) => l.id === listingId);
    if (i >= 0) MockDB.listings[i].boosted = !!value;
    return true;
  },
  getChat: async (roomId) => {
    await delay(80);
    return MockDB.chats[roomId] || [];
  },
  sendMessage: async (roomId, message) => {
    await delay(50);
    if (!MockDB.chats[roomId]) MockDB.chats[roomId] = [];
    MockDB.chats[roomId].push({ ...message, id: "MSG-" + Math.random(), at: Date.now(), read: false });
    return true;
  },
  uploadDoc: async ({ userId, docType, uri }) => {
    await delay(150);
    const id = "DOC-" + Math.floor(Math.random() * 100000);
    MockDB.documents.push({ id, userId, docType, uri, status: "under_review", at: Date.now() });
    return id;
  },
  recordCommission: async ({ userId, amount, city, split = { marketing: 0.35, telecaller: 0.05 } }) => {
    await delay(150);
    const id = "COM-" + Math.floor(Math.random() * 100000);
    const net = amount * (1 - (split.marketing + split.telecaller));
    MockDB.commissions.push({ id, userId, amount, city, split, net, at: Date.now(), status: "pending" });
    return id;
  },
  scheduleVisit: async ({ listingId, userId, when }) => {
    await delay(120);
    const id = "VISIT-" + Math.floor(Math.random() * 100000);
    MockDB.visits.push({ id, listingId, userId, when, status: "scheduled" });
    return id;
  },
  checkIn: async ({ visitId, lat, lng }) => {
    await delay(80);
    const v = MockDB.visits.find((x) => x.id === visitId);
    if (v) v.checkIn = { lat, lng, at: Date.now() };
    return true;
  },
};

/* ---------------- APP CONTEXT ---------------- */
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("hi");
  const value = useMemo(() => ({ user, setUser, role, setRole, loading, setLoading, language, setLanguage }), [user, role, loading, language]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* ---------------- HELPERS ---------------- */
const money = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs}h`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `${mins}m`;
  return "now";
};
const Img = ({ uri, style }) => {
  const [src, setSrc] = useState(uri);
  return (
    <Image
      source={{ uri: src }}
      onError={() => setSrc(ASSETS.placeholder)}
      style={style}
    />
  );
};

/* ---------------- TOP BAR ---------------- */
const TopBar = ({ title, right, showBack, onBack, showLogo }) => (
  <View style={styles.topBar}>
    <View style={{ width: 36, alignItems: "flex-start" }}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24, height: 24 }} />
      )}
    </View>
    <View style={{ alignItems: "center", flexDirection: "row" }}>
      {showLogo ? (
        <Img uri={ASSETS.logo} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4 }} />
      ) : null}
      <Text style={{ fontWeight: "800", fontSize: 18 }}>{title}</Text>
    </View>
    <View style={{ width: 36, alignItems: "flex-end" }}>{right}</View>
  </View>
);

/* ---------------- SCREENS ---------------- */
const Splash = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <SafeAreaView style={styles.center}>
      <StatusBar barStyle="dark-content" />
      <Img uri={ASSETS.logo} style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 14 }} />
      <Text style={{ fontSize: 26, fontWeight: "900" }}>Welcome to Neat Real Estate</Text>
      <Text style={{ marginTop: 6, color: COLORS.dark }}>Premium Property Platform</Text>
      <Text style={{ marginTop: 10, color: COLORS.muted, fontSize: 12 }}>loading…</Text>
    </SafeAreaView>
  );
};

const RoleSelection = ({ onSelect, onBack }) => {
  const roles = ["Buyer", "Dealer", "Seller", "Advocate", "Loan Agent", "Freelance Consultant", "Admin"];
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Welcome to Neat Real Estate" showBack={false} onBack={onBack} showLogo />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: COLORS.dark, marginBottom: 14 }}>Select role to continue</Text>
        {roles.map((r) => (
          <TouchableOpacity key={r} onPress={() => onSelect(r)} style={[styles.card, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", fontSize: 16 }}>{r}</Text>
              <Text style={{ color: COLORS.dark, marginTop: 4 }}>
                {r === "Buyer" ? "Search & connect" : r === "Dealer" ? "Manage listings & leads" : "Role functions"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        ))}
        <Text style={{ marginTop: 12, textAlign: "center", color: COLORS.muted }}>or</Text>
        <TouchableOpacity style={[styles.pill, { alignSelf: "center", marginTop: 8 }]} onPress={() => onSelect("Buyer")}>
          <Text>Continue as Guest (Buyer)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const AuthScreen = ({ role, onBack, onAuthed }) => {
  const { setUser, setRole, setLoading } = useApp();
  const [identifier, setIdentifier] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const sendOtp = async () => {
    if (!identifier) return Alert.alert("Enter mobile/email");
    setLoading(true);
    const r = await api.sendOtp(identifier);
    setLoading(false);
    if (r.success) {
      setOtpSent(true);
      Alert.alert("OTP sent (mock)", "Use code 123456");
    }
  };
  const verify = async () => {
    setLoading(true);
    const ok = await api.verifyOtp({ identifier, code: otp });
    if (!ok) {
      setLoading(false);
      return Alert.alert("Invalid OTP");
    }
    const u = await api.loginOrRegister({ identifier, role });
    setUser(u);
    setRole(u.role);
    setLoading(false);
    onAuthed();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Login / Register" showBack onBack={onBack} showLogo />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ marginBottom: 8 }}>Role: {role}</Text>
        <TextInput placeholder="Mobile or Email" style={styles.input} value={identifier} onChangeText={setIdentifier} />
        {otpSent && <TextInput placeholder="OTP (123456)" style={styles.input} keyboardType="number-pad" value={otp} onChangeText={setOtp} />}
        {!otpSent ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={sendOtp}>
            <Text style={styles.btnText}>Send OTP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 8 }]} onPress={verify}>
            <Text style={styles.btnText}>Verify & Continue</Text>
          </TouchableOpacity>
        )}
        <Text style={{ marginTop: 12, color: COLORS.muted }}>[INTEGRATE] Twilio / Email • JWT • device binding</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const PropertyCard = ({ item, onPress, onChat, onCall }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { padding: 10 }]}>
      <Img uri={item.media?.[0]?.uri || "https://picsum.photos/seed/p/800/500"} style={{ width: "100%", height: 160, borderRadius: 12 }} />
      <Text style={{ fontWeight: "800", fontSize: 16, marginTop: 8 }}>{item.title}</Text>
      <Text style={{ color: COLORS.dark, marginTop: 6 }}>{item.description}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
        <Text style={{ fontWeight: "800" }}>{money(item.price)}</Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={onCall} style={{ marginRight: 8 }}>
            <Ionicons name="call" size={20} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onChat}>
            <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={{ color: COLORS.muted, marginTop: 6 }}>Posted {timeAgo(item.createdAt)} • {item.category}</Text>
    </TouchableOpacity>
  );
};

const BuyerHome = ({ goToListing, openChat, startCall, openMegaMenu, onBack, showBack }) => {
  const [filters, setFilters] = useState({ category: "All" });
  const [data, setData] = useState([]);
  const [loading, setLoadingLocal] = useState(true);

  const load = async () => {
    setLoadingLocal(true);
    const res = await api.listProperties(filters);
    setData(res);
    setLoadingLocal(false);
  };
  useEffect(() => {
    load();
  }, [filters]);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Discover"
        showBack={showBack}
        onBack={onBack}
        showLogo
        right={
          <TouchableOpacity onPress={openMegaMenu}>
            <Ionicons name="grid-outline" size={22} color={COLORS.dark} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={{ padding: 12 }}>
        <TextInput
          placeholder="Search by title, city…"
          style={styles.input}
          value={filters.query || ""}
          onChangeText={(t) => setFilters({ ...filters, query: t })}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {["All", "Plot", "House", "Flat", "Commercial", "Farmhouse"].map((c) => (
            <TouchableOpacity key={c} onPress={() => setFilters({ ...filters, category: c })} style={{ backgroundColor: filters.category === c ? COLORS.primary : COLORS.white, padding: 8, borderRadius: 999, marginRight: 8 }}>
              <Text style={{ color: filters.category === c ? COLORS.white : COLORS.dark }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <PropertyCard
                item={item}
                onPress={() => goToListing(item)}
                onChat={() => openChat(item)}
                onCall={() => startCall(item)}
              />
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const DealerHome = ({ onAdd, onListings, onLeads, onCommissions, openMegaMenu, onBack, showBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Dealer Dashboard"
        showBack={showBack}
        onBack={onBack}
        showLogo
        right={
          <TouchableOpacity onPress={openMegaMenu}>
            <Ionicons name="grid-outline" size={22} color={COLORS.dark} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={{ padding: 12 }}>
        <View style={styles.card}>
          <Text style={{ fontWeight: "800" }}>Quick Actions</Text>
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginRight: 8 }]} onPress={onAdd}>
              <Text style={styles.btnText}>Add Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={onListings}>
              <Text style={styles.btnText}>My Listings</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <TouchableOpacity style={[styles.btnAccent, { flex: 1, marginRight: 8 }]} onPress={onLeads}>
              <Text style={styles.btnText}>Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAccent, { flex: 1 }]} onPress={onCommissions}>
              <Text style={styles.btnText}>Commissions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={{ fontWeight: "800", marginBottom: 8 }}>SaleFast</Text>
          <Text style={{ color: COLORS.dark }}>Boost your listings to the top. Refund rules apply after deal closure.</Text>
          <TouchableOpacity
            style={[styles.btnPrimary, { marginTop: 12 }]}
            onPress={() => Alert.alert("SaleFast", "Open payment & boost flow [INTEGRATE: Razorpay/Stripe]")}
          >
            <Text style={styles.btnText}>Buy Boost</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const AdminPanel = ({ onBack, showBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Admin Panel" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView style={{ padding: 12 }}>
        <View style={styles.card}>
          <Text style={{ fontWeight: "800" }}>Listings</Text>
          <Text style={{ color: COLORS.dark, marginTop: 8 }}>Approve / Reject listings here.</Text>
        </View>
        <View style={styles.card}>
          <Text style={{ fontWeight: "800" }}>Users</Text>
          <Text style={{ color: COLORS.dark, marginTop: 8 }}>Manage users, roles, bans.</Text>
        </View>
        <View style={styles.card}>
          <Text style={{ fontWeight: "800" }}>Reports</Text>
          <Text style={{ color: COLORS.dark, marginTop: 8 }}>Weekly / Monthly analytics placeholders.</Text>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={{ fontWeight: "800" }}>🛠 Admin Panel (Extras)</Text>
          <Text style={{ color: COLORS.dark, marginTop: 8 }}>- Manage Users</Text>
          <Text style={{ color: COLORS.dark, marginTop: 4 }}>- Manage Dealers</Text>
          <Text style={{ color: COLORS.dark, marginTop: 4 }}>- View Reports</Text>
          <Text style={{ color: COLORS.dark, marginTop: 4 }}>- Handle Complaints</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ListingDetail = ({ listing, onSchedule, onChat, onCall, onBoost, onBack, showBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title={listing.title} right={<Text style={{ color: COLORS.muted }}>{listing.category}</Text>} showBack={showBack} onBack={onBack} showLogo />
      <ScrollView style={{ padding: 12 }}>
        <Img uri={listing.media?.[0]?.uri || "https://picsum.photos/seed/p/800/500"} style={{ width: "100%", height: 220, borderRadius: 12 }} />
        <Text style={{ fontWeight: "800", fontSize: 18, marginTop: 10 }}>{money(listing.price)}</Text>
        <Text style={{ color: COLORS.dark, marginTop: 8 }}>{listing.description}</Text>
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity style={[styles.btnAccent, { marginBottom: 8 }]} onPress={onSchedule}>
            <Text style={styles.btnText}>Schedule Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { marginBottom: 8 }]} onPress={onChat}>
            <Text style={styles.btnText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: listing.boosted ? COLORS.accent : COLORS.primary }]} onPress={onBoost}>
            <Text style={styles.btnText}>{listing.boosted ? "Boosted" : "Boost with SaleFast"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={{ fontWeight: "800" }}>Map (placeholder)</Text>
          <Text style={{ color: COLORS.muted, marginTop: 8 }}>
            [INTEGRATE] Google Maps / Mapbox • lat: {listing.location.lat}, lng: {listing.location.lng}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ChatScreen = ({ roomId, otherName, onBack, showBack }) => {
  const { user } = useApp();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const load = async () => setMessages(await api.getChat(roomId));
  useEffect(() => {
    load();
  }, [roomId]);

  const send = async () => {
    if (!text) return;
    await api.sendMessage(roomId, { from: user?.id || "anon", name: user?.name || "You", text });
    setText("");
    load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title={otherName || "Chat"} showBack={showBack} onBack={onBack} showLogo />
      <FlatList
        style={{ padding: 12 }}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.from === user?.id ? "flex-end" : "flex-start",
              backgroundColor: item.from === user?.id ? COLORS.primary : COLORS.white,
              padding: 10,
              borderRadius: 12,
              marginBottom: 8,
              maxWidth: "85%",
            }}
          >
            <Text style={{ color: item.from === user?.id ? COLORS.white : COLORS.dark, fontWeight: "700" }}>{item.name}</Text>
            <Text style={{ color: item.from === user?.id ? COLORS.white : COLORS.dark }}>{item.text}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: COLORS.white }}>
        <TextInput placeholder="Type a message" style={{ flex: 1, borderRadius: 999, padding: 10, backgroundColor: COLORS.light, marginRight: 8 }} value={text} onChangeText={setText} />
        <TouchableOpacity style={styles.btnPrimary} onPress={send}>
          <Text style={styles.btnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AddListing = ({ onCreated, onBack, showBack }) => {
  const { user } = useApp();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    areaGaz: "",
    front: "",
    roadWidth: "",
    category: "Plot",
    city: "",
    state: "",
    area: "",
  });

  const create = async () => {
    if (!form.title || !form.price) return Alert.alert("Missing", "Please fill title and price");
    const id = await api.createListing({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      areaGaz: Number(form.areaGaz),
      front: Number(form.front),
      roadWidth: Number(form.roadWidth),
      category: form.category,
      media: [{ type: "image", uri: "https://picsum.photos/seed/new/800/500" }],
      location: { city: form.city, state: form.state, area: form.area, lat: 28.6, lng: 77.2 },
      dealerId: user?.id,
      sellerId: user?.id,
    });
    Alert.alert("Listing created", id);
    onCreated && onCreated();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Add Listing" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView style={{ padding: 12 }}>
        <TextInput placeholder="Title" style={styles.input} value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
        <TextInput placeholder="Description" style={[styles.input, { height: 100 }]} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline />
        <TextInput placeholder="Price (₹)" style={styles.input} keyboardType="numeric" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
        <TextInput placeholder="Area (गज)" style={styles.input} keyboardType="numeric" value={form.areaGaz} onChangeText={(t) => setForm({ ...form, areaGaz: t })} />
        <TextInput placeholder="Front (ft)" style={styles.input} keyboardType="numeric" value={form.front} onChangeText={(t) => setForm({ ...form, front: t })} />
        <TextInput placeholder="Road width (ft)" style={styles.input} keyboardType="numeric" value={form.roadWidth} onChangeText={(t) => setForm({ ...form, roadWidth: t })} />
        <TextInput placeholder="City" style={styles.input} value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} />
        <TextInput placeholder="State" style={styles.input} value={form.state} onChangeText={(t) => setForm({ ...form, state: t })} />
        <TextInput placeholder="Local Area" style={styles.input} value={form.area} onChangeText={(t) => setForm({ ...form, area: t })} />
        <TouchableOpacity style={styles.btnPrimary} onPress={create}>
          <Text style={styles.btnText}>Create Listing</Text>
        </TouchableOpacity>
        <Text style={{ marginTop: 10, color: COLORS.muted }}>[INTEGRATE] Photo & video uploader → S3</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const KYCScreen = ({ onBack, showBack }) => {
  const { user } = useApp();
  const [docs, setDocs] = useState(MockDB.documents.filter((d) => d.userId === user?.id));

  const upload = async () => {
    const id = await api.uploadDoc({ userId: user.id, docType: "Aadhaar", uri: "local://mock" });
    Alert.alert("Uploaded", id);
    setDocs(MockDB.documents.filter((d) => d.userId === user?.id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="KYC & Documents" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView style={{ padding: 12 }}>
        <TouchableOpacity style={styles.btnPrimary} onPress={upload}>
          <Text style={styles.btnText}>Upload Document</Text>
        </TouchableOpacity>
        {docs.map((d) => (
          <View key={d.id} style={[styles.card, { marginTop: 12 }]}>
            <Text>{d.docType}</Text>
            <Text>Status: {d.status}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 10, color: COLORS.muted }}>[INTEGRATE] eKYC provider • Advocate review queue</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const CommissionOpsScreen = ({ onBack, showBack }) => {
  const { user } = useApp();
  const [rows, setRows] = useState(MockDB.commissions.filter((c) => c.userId === user?.id));

  const add = async () => {
    const id = await api.recordCommission({ userId: user.id, amount: 50000, city: "Noida" });
    Alert.alert("Commission logged", id);
    setRows(MockDB.commissions.filter((c) => c.userId === user?.id));
  };

  const payout = async (cid) => {
    Alert.alert("Payout", "Payout requested (mock).");
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Commissions & Payouts" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView style={{ padding: 12 }}>
        <TouchableOpacity style={styles.btnPrimary} onPress={add}>
          <Text style={styles.btnText}>Add Sample Commission</Text>
        </TouchableOpacity>
        {rows.map((r) => (
          <View key={r.id} style={[styles.card, { marginTop: 12 }]}>
            <Text>Amount: {money(r.amount)} • Net: {money(r.net)}</Text>
            <Text>City: {r.city} • Status: {r.status}</Text>
            <TouchableOpacity style={[styles.btnAccent, { marginTop: 8 }]} onPress={() => payout(r.id)}>
              <Text style={styles.btnText}>Request Payout</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Text style={{ marginTop: 10, color: COLORS.muted }}>[INTEGRATE] Razorpay/Stripe • Escrow • Refund rules</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const LeadsScreen = ({ onBack, showBack }) => {
  const { user } = useApp();
  const [leads, setLeads] = useState(MockDB.leads.filter((l) => l.toUserId === user?.id));

  const autoAssign = async () => {
    const firstListing = MockDB.listings[0];
    const lead = {
      id: "LEAD-" + Math.floor(Math.random() * 100000),
      listingId: firstListing.id,
      fromUserId: "U-999",
      toUserId: user.id,
      source: "AutoMatch",
      status: "new",
      at: Date.now(),
    };
    MockDB.leads.push(lead);
    setLeads(MockDB.leads.filter((l) => l.toUserId === user?.id));
    Alert.alert("Lead assigned", lead.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Leads" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView style={{ padding: 12 }}>
        <TouchableOpacity style={styles.btnAccent} onPress={autoAssign}>
          <Text style={styles.btnText}>Auto-Assign Leads</Text>
        </TouchableOpacity>
        {leads.map((l) => (
          <View key={l.id} style={[styles.card, { marginTop: 12 }]}>
            <Text>ID: {l.id} • Source: {l.source}</Text>
            <Text>Listing: {l.listingId}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 10, color: COLORS.muted }}>[INTEGRATE] Language & location notifications, telecaller module</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const VisitScheduler = ({ listing, onBack, showBack }) => {
  const { user } = useApp();
  const [when, setWhen] = useState("2025-08-20 15:00");
  const schedule = async () => {
    const id = await api.scheduleVisit({ listingId: listing.id, userId: user.id, when });
    Alert.alert("Visit scheduled", id);
  };
  const checkIn = async () => {
    await api.checkIn({ visitId: MockDB.visits[0]?.id || "VISIT-0", lat: 28.63, lng: 77.37 });
    Alert.alert("Checked in (mock)");
  };
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Schedule Visit" showBack={showBack} onBack={onBack} showLogo />
      <View style={{ padding: 12 }}>
        <Text style={{ marginBottom: 8 }}>{listing.title}</Text>
        <TextInput value={when} onChangeText={setWhen} style={styles.input} />
        <TouchableOpacity style={styles.btnPrimary} onPress={schedule}>
          <Text style={styles.btnText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAccent, { marginTop: 8 }]} onPress={checkIn}>
          <Text style={styles.btnText}>GPS Check-in (mock)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/* ---------- EXTRA SCREENS (quick) ---------- */
const BuyersListScreen = ({ onOpenDetails, onBack, showBack }) => {
  const buyers = [{ username: "Rahul" }, { username: "Amit" }, { username: "Sonal" }];
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Buyers List" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {buyers.map((buyer, i) => (
          <TouchableOpacity key={i} style={styles.pill} onPress={() => onOpenDetails(buyer)}>
            <Text style={{ fontSize: 16 }}>{buyer.username}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const SellersListScreen = ({ onOpenDetails, onBack, showBack }) => {
  const sellers = [{ username: "Rohit" }, { username: "Meena" }, { username: "Suresh" }];
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Sellers List" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {sellers.map((seller, i) => (
          <TouchableOpacity key={i} style={styles.pill} onPress={() => onOpenDetails(seller)}>
            <Text style={{ fontSize: 16 }}>{seller.username}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfitScreen = ({ onBack, showBack }) => (
  <SafeAreaView style={styles.center}>
    <TopBar title="Profit Dashboard" showBack={showBack} onBack={onBack} showLogo />
    <Text style={{ fontSize: 22, fontWeight: "bold" }}>💹 Profit Dashboard</Text>
    <Text style={{ fontSize: 18, marginTop: 10 }}>Total Profit: ₹ 1,20,000</Text>
  </SafeAreaView>
);

const DealersScreen = ({ onBack, showBack }) => (
  <SafeAreaView style={styles.container}>
    <TopBar title="Dealers" showBack={showBack} onBack={onBack} showLogo />
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pill}>Dealer 1 — Active</Text>
      <Text style={styles.pill}>Dealer 2 — Pending</Text>
      <Text style={styles.pill}>Dealer 3 — Active</Text>
    </ScrollView>
  </SafeAreaView>
);

const CommissionReportScreen = ({ onBack, showBack }) => (
  <SafeAreaView style={styles.container}>
    <TopBar title="Commission Report" showBack={showBack} onBack={onBack} showLogo />
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pill}>Rahul → ₹5000</Text>
      <Text style={styles.pill}>Rohit → ₹3200</Text>
      <Text style={styles.pill}>Sonal → ₹2500</Text>
    </ScrollView>
  </SafeAreaView>
);

const PayoutRequestsScreen = ({ onBack, showBack }) => (
  <SafeAreaView style={styles.container}>
    <TopBar title="Payout Requests" showBack={showBack} onBack={onBack} showLogo />
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pill}>Athar → ₹10,000 (Pending)</Text>
      <Text style={styles.pill}>Amit → ₹7,500 (Approved)</Text>
    </ScrollView>
  </SafeAreaView>
);

const ProfileScreenSimple = ({ onBack, showBack }) => {
  const [name, setName] = useState("Athar");
  const [email, setEmail] = useState("test@example.com");
  return (
    <SafeAreaView style={styles.center}>
      <TopBar title="My Profile" showBack={showBack} onBack={onBack} showLogo />
      <Img uri="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 20 }} />
      <TextInput style={[styles.input, { width: "80%" }]} value={name} onChangeText={setName} placeholder="Enter Name" />
      <TextInput style={[styles.input, { width: "80%" }]} value={email} onChangeText={setEmail} placeholder="Enter Email" />
    </SafeAreaView>
  );
};

const DetailsScreen = ({ user, onBack, showBack }) => (
  <SafeAreaView style={styles.center}>
    <TopBar title="Details" showBack={showBack} onBack={onBack} showLogo />
    <Text style={{ fontSize: 22, fontWeight: "bold" }}>Details Page</Text>
    {!!user && <Text style={{ fontSize: 18, marginTop: 10 }}>Selected: {user.username}</Text>}
  </SafeAreaView>
);

const SimpleLoginScreen = ({ onLoggedIn, onBack, showBack }) => (
  <SafeAreaView style={styles.center}>
    <TopBar title="Simple Login" showBack={showBack} onBack={onBack} showLogo />
    <Img uri="https://cdn-icons-png.flaticon.com/512/702/702451.png" style={{ width: 100, height: 100, marginBottom: 20 }} />
    <Text style={{ fontSize: 20, marginBottom: 20 }}>Login to Continue</Text>
    <TouchableOpacity style={[styles.btnPrimary, { width: 200 }]} onPress={onLoggedIn}>
      <Text style={styles.btnText}>Login</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const MegaMenu = ({ go, onBack, showBack }) => {
  const Item = ({ label, to }) => (
    <TouchableOpacity style={styles.pill} onPress={() => go(to)}>
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="All Features" showBack={showBack} onBack={onBack} showLogo />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Item label="👥 Buyers" to="BUYERS" />
        <Item label="🏠 Sellers" to="SELLERS" />
        <Item label="💹 Profit" to="PROFIT" />
        <Item label="👤 Profile (Simple)" to="PROFILE_SIMPLE" />
        <Item label="🛠 Admin (Panel)" to="ADMIN" />
        <Item label="🤝 Dealers" to="DEALERS" />
        <Item label="💰 Commission (Report)" to="COMMISSION_REPORT" />
        <Item label="💵 Payout Requests" to="PAYOUTS" />
        <Item label="🔐 Simple Login" to="LOGIN_SIMPLE" />
        <View style={{ height: 10 }} />
        <Item label="📄 KYC & Documents" to="KYC" />
        <Item label="📈 Commissions & Payouts (Ops)" to="COMMISSION_OPS" />
        <Item label="📨 Leads" to="LEADS" />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------------- SIMPLE NAV (internal history stack) ---------------- */
const SCREENS = {
  SPLASH: "SPLASH",
  ROLES: "ROLES",
  AUTH: "AUTH",
  BUYER_HOME: "BUYER_HOME",
  DEALER_HOME: "DEALER_HOME",
  ADMIN: "ADMIN",
  LISTING: "LISTING",
  ADD: "ADD",
  CHAT: "CHAT",
  VISIT: "VISIT",
  KYC: "KYC",
  COMMISSION_OPS: "COMMISSION_OPS",
  LEADS: "LEADS",
  MEGA: "MEGA",
  BUYERS: "BUYERS",
  SELLERS: "SELLERS",
  PROFIT: "PROFIT",
  DEALERS: "DEALERS",
  COMMISSION_REPORT: "COMMISSION_REPORT",
  PAYOUTS: "PAYOUTS",
  PROFILE_SIMPLE: "PROFILE_SIMPLE",
  DETAILS: "DETAILS",
  LOGIN_SIMPLE: "LOGIN_SIMPLE",
};

export default function App() {
  const [history, setHistory] = useState([SCREENS.SPLASH]); // stack
  const [roleChoice, setRoleChoice] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatRoom, setChatRoom] = useState(null);
  const [chatWith, setChatWith] = useState("");
  const [detailUser, setDetailUser] = useState(null);

  const screen = history[history.length - 1];
  const go = (to) => setHistory((h) => [...h, to]);
  const replaceWith = (to) => setHistory([to]); // clear back stack (e.g., after auth)
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const showBack = history.length > 1;

  return (
    <AppProvider>
      {/* CONDITIONAL ROUTING */}
      {screen === SCREENS.SPLASH && <Splash onDone={() => replaceWith(SCREENS.ROLES)} />}

      {screen === SCREENS.ROLES && (
        <RoleSelection
          onBack={back}
          onSelect={(r) => {
            setRoleChoice(r);
            go(SCREENS.AUTH);
          }}
        />
      )}

      {screen === SCREENS.AUTH && (
        <AuthScreen
          role={roleChoice}
          onBack={back}
          onAuthed={() => {
            // After auth, jump to role home & clear stack for clean back behavior
            const target = roleChoice === "Buyer" ? SCREENS.BUYER_HOME : roleChoice === "Admin" ? SCREENS.ADMIN : SCREENS.DEALER_HOME;
            replaceWith(target);
          }}
        />
      )}

      {screen === SCREENS.BUYER_HOME && (
        <BuyerHome
          showBack={showBack}
          onBack={back}
          goToListing={(item) => {
            setSelectedListing(item);
            go(SCREENS.LISTING);
          }}
          openChat={(item) => {
            setChatRoom("ROOM-" + item.id);
            setChatWith(item.title);
            go(SCREENS.CHAT);
          }}
          startCall={(item) => Linking.openURL(`tel:${"+919999999999"}`)}
          openMegaMenu={() => go(SCREENS.MEGA)}
        />
      )}

      {screen === SCREENS.DEALER_HOME && (
        <DealerHome
          showBack={showBack}
          onBack={back}
          onAdd={() => go(SCREENS.ADD)}
          onListings={() => replaceWith(SCREENS.BUYER_HOME)}
          onLeads={() => go(SCREENS.LEADS)}
          onCommissions={() => go(SCREENS.COMMISSION_OPS)}
          openMegaMenu={() => go(SCREENS.MEGA)}
        />
      )}

      {screen === SCREENS.ADMIN && <AdminPanel showBack={showBack} onBack={back} />}

      {screen === SCREENS.LISTING && selectedListing && (
        <ListingDetail
          listing={selectedListing}
          showBack={showBack}
          onBack={back}
          onSchedule={() => go(SCREENS.VISIT)}
          onChat={() => {
            setChatRoom("ROOM-" + selectedListing.id);
            setChatWith(selectedListing.title);
            go(SCREENS.CHAT);
          }}
          onCall={() => Linking.openURL("tel:+919999999999")}
          onBoost={async () => {
            await api.toggleBoost(selectedListing.id, !selectedListing.boosted);
            Alert.alert("SaleFast", "Boost toggled (mock)");
            setSelectedListing({ ...selectedListing, boosted: !selectedListing.boosted });
          }}
        />
      )}

      {screen === SCREENS.ADD && <AddListing showBack={showBack} onBack={back} onCreated={() => replaceWith(SCREENS.DEALER_HOME)} />}
      {screen === SCREENS.CHAT && <ChatScreen showBack={showBack} onBack={back} roomId={chatRoom} otherName={chatWith} />}
      {screen === SCREENS.VISIT && <VisitScheduler showBack={showBack} onBack={back} listing={selectedListing || MockDB.listings[0]} />}
      {screen === SCREENS.KYC && <KYCScreen showBack={showBack} onBack={back} />}
      {screen === SCREENS.COMMISSION_OPS && <CommissionOpsScreen showBack={showBack} onBack={back} />}
      {screen === SCREENS.LEADS && <LeadsScreen showBack={showBack} onBack={back} />}

      {screen === SCREENS.MEGA && <MegaMenu showBack={showBack} onBack={back} go={(to) => go(SCREENS[to])} />}

      {screen === SCREENS.BUYERS && (
        <BuyersListScreen
          showBack={showBack}
          onBack={back}
          onOpenDetails={(user) => {
            setDetailUser(user);
            go(SCREENS.DETAILS);
          }}
        />
      )}

      {screen === SCREENS.SELLERS && (
        <SellersListScreen
          showBack={showBack}
          onBack={back}
          onOpenDetails={(user) => {
            setDetailUser(user);
            go(SCREENS.DETAILS);
          }}
        />
      )}

      {screen === SCREENS.PROFIT && <ProfitScreen showBack={showBack} onBack={back} />}
      {screen === SCREENS.DEALERS && <DealersScreen showBack={showBack} onBack={back} />}
      {screen === SCREENS.COMMISSION_REPORT && <CommissionReportScreen showBack={showBack} onBack={back} />}
      {screen === SCREENS.PAYOUTS && <PayoutRequestsScreen showBack={showBack} onBack={back} />}
      {screen === SCREENS.PROFILE_SIMPLE && <ProfileScreenSimple showBack={showBack} onBack={back} />}
      {screen === SCREENS.DETAILS && <DetailsScreen showBack={showBack} onBack={back} user={detailUser} />}
      {screen === SCREENS.LOGIN_SIMPLE && (
        <SimpleLoginScreen
          showBack={showBack}
          onBack={back}
          onLoggedIn={() => Alert.alert("Login", "Logged in (mock)")}
        />
      )}
    </AppProvider>
  );
}