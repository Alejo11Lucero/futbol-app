import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import BackButton from "../components/BackButton";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  async function handleRegister() {
    if (!username || !email || !password || !confirmPassword) {
      setMessage("⚠️ Completá todos los campos");
      return;
    }

    if (username.trim().length < 3) {
      setMessage("⚠️ El nombre de usuario debe tener al menos 3 caracteres");
      return;
    }

    if (password.length < 6) {
      setMessage("⚠️ Mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(`❌ ${error.message}`);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setLoading(false);
      setMessage("❌ No se pudo crear el usuario");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userId,
        username: username.trim(),
      },
    ]);

    setLoading(false);

    if (profileError) {
      setMessage("❌ Ese nombre de usuario ya existe o hubo un error");
      return;
    }

    setMessage("📩 Revisá tu email para confirmar tu cuenta");

    setTimeout(() => {
      router.replace("/login");
    }, 1800);
  }

  return (
    <View style={container}>
      <BackButton />

      <Text style={title}>Crear cuenta</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Nombre de usuario"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        style={input}
      />

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

      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        style={input}
      />

      <Pressable onPress={handleRegister} style={button} disabled={loading}>
        <Text style={buttonText}>
          {loading ? "Creando..." : "Registrarme"}
        </Text>
      </Pressable>

      <Link href="/login" asChild>
        <Pressable style={secondaryButton}>
          <Text style={secondaryText}>Ya tengo cuenta</Text>
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