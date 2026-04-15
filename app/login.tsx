import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (message) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [message, fadeAnim]);

  async function handleLogin() {
    if (!email || !password) {
      setMessage("⚠️ Completá email y contraseña");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setMessage("📩 Confirmá tu email antes de ingresar");
      } else {
        setMessage("❌ Email o contraseña incorrectos");
      }
      return;
    }
  }

  return (
    <View style={container}>
      <Text style={title}>Iniciar sesión</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        style={input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        style={input}
      />

      <Pressable onPress={handleLogin} style={button} disabled={loading}>
        <Text style={buttonText}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Text>
      </Pressable>

      <Link href="/register" asChild>
        <Pressable style={secondaryButton}>
          <Text style={secondaryText}>Crear cuenta</Text>
        </Pressable>
      </Link>

      {message && (
        <Animated.View style={[toastContainer, { opacity: fadeAnim }]}>
          <Text style={toastText}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const container = {
  flex: 1,
  justifyContent: "center" as const,
  padding: 24,
  backgroundColor: "#0f172a",
};

const title = {
  color: "#fff",
  fontSize: 28,
  fontWeight: "bold" as const,
  marginBottom: 24,
  textAlign: "center" as const,
};

const input = {
  backgroundColor: "#1e293b",
  color: "#fff",
  padding: 14,
  borderRadius: 10,
  marginBottom: 12,
};

const button = {
  backgroundColor: "#22c55e",
  padding: 14,
  borderRadius: 10,
  alignItems: "center" as const,
  marginTop: 8,
};

const buttonText = {
  color: "#000",
  fontWeight: "bold" as const,
};

const secondaryButton = {
  marginTop: 16,
  alignItems: "center" as const,
};

const secondaryText = {
  color: "#93c5fd",
  fontWeight: "bold" as const,
};

const toastContainer = {
  position: "absolute" as const,
  bottom: 35,
  alignSelf: "center" as const,
  backgroundColor: "#22c55e",
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  maxWidth: "85%" as const,
};

const toastText = {
  color: "#000",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
};