import { router } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import BackButton from "../components/BackButton";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function JoinTournamentScreen() {
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  function showToast(text: string) {
    setMessage(text);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setMessage(null));
    }, 2200);
  }

  async function handleJoin() {
    if (!user) {
      showToast("❌ No hay usuario");
      return;
    }

    if (!code.trim()) {
      showToast("⚠️ Ingresá un código");
      return;
    }

    setLoading(true);

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("id, name")
      .eq("invite_code", code.trim().toUpperCase())
      .single();

    if (error || !tournament) {
      setLoading(false);
      showToast("❌ Código inválido");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      setLoading(false);
      showToast("❌ No se pudo cargar tu perfil");
      return;
    }

    const { error: joinError } = await supabase
      .from("tournament_members")
      .insert([
        {
          user_id: user.id,
          tournament_id: tournament.id,
          role: "player",
        },
      ]);

    if (joinError) {
      setLoading(false);
      showToast("⚠️ Ya estás en este torneo");
      return;
    }

    const { error: playerError } = await supabase.from("players").insert([
      {
        user_id: user.id,
        tournament_id: tournament.id,
        display_name: profile.username,
      },
    ]);

    setLoading(false);

    if (playerError) {
      showToast("❌ Te uniste, pero falló la creación del jugador");
      return;
    }

    showToast(`✅ Te uniste a ${tournament.name}`);

    setTimeout(() => {
      router.replace("/my-tournaments");
    }, 1500);
  }

  return (
    <View style={container}>
      <BackButton />

      <Text style={title}>Unirse a torneo</Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Código de invitación"
        placeholderTextColor="#94a3b8"
        autoCapitalize="characters"
        style={input}
      />

      <Pressable onPress={handleJoin} style={button} disabled={loading}>
        <Text style={buttonText}>{loading ? "Uniéndose..." : "Unirse"}</Text>
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
};

const toastText = {
  color: "#000",
  fontWeight: "bold" as const,
};
