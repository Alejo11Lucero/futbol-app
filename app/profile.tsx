import { useEffect, useState } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileScreen() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      fetchProfile();
    }
  }, [user]);

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

  function showToast(text: string) {
    setMessage(text);
  }

  async function fetchProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error cargando perfil:", error.message);
      return;
    }

    setUsername(data.username);
    setOriginalUsername(data.username);
  }

  async function handleSave() {
    if (!user) return;

    if (!username.trim()) {
      showToast("⚠️ Escribí un nombre de usuario");
      return;
    }

    if (username.trim().length < 3) {
      showToast("⚠️ Mínimo 3 caracteres");
      return;
    }

    if (username.trim() === originalUsername) {
      showToast("ℹ️ No hiciste cambios");
      return;
    }

    setLoading(true);

    // 1. actualizar profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id);

    if (profileError) {
      setLoading(false);
      showToast("❌ Ese nombre ya existe o no se pudo guardar");
      return;
    }

    // 2. actualizar display_name en todos los players del usuario
    const { error: playersError } = await supabase
      .from("players")
      .update({ display_name: username.trim() })
      .eq("user_id", user.id);

    setLoading(false);

    if (playersError) {
      showToast("⚠️ Perfil actualizado, pero falló la sync de jugadores");
      setOriginalUsername(username.trim());
      return;
    }

    setOriginalUsername(username.trim());
    showToast("✅ Perfil actualizado");
  }

  return (
    <View style={container}>
      <Text style={title}>Mi perfil</Text>

      <Text style={label}>Email</Text>
      <TextInput
        value={email}
        editable={false}
        style={[input, disabledInput]}
        placeholderTextColor="#94a3b8"
      />

      <Text style={label}>Nombre de usuario</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={input}
        placeholder="Tu nombre de usuario"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
      />

      <Pressable onPress={handleSave} style={button} disabled={loading}>
        <Text style={buttonText}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Text>
      </Pressable>

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
  textAlign: "center" as const,
  marginBottom: 24,
};

const label = {
  color: "#cbd5e1",
  marginBottom: 8,
  marginTop: 8,
  fontWeight: "bold" as const,
};

const input = {
  backgroundColor: "#1e293b",
  color: "#fff",
  padding: 14,
  borderRadius: 10,
  marginBottom: 12,
};

const disabledInput = {
  opacity: 0.7,
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