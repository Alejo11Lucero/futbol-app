import { useState } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import BackButton from "../components/BackButton";

export default function CreateTournamentScreen() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

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

  async function handleCreateTournament() {
    if (!user) {
      showToast("❌ No hay usuario autenticado");
      return;
    }

    if (!name.trim()) {
      showToast("⚠️ Escribí un nombre para el torneo");
      return;
    }

    setLoading(true);

    const inviteCode = generateInviteCode();

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

    const { data: tournamentData, error: tournamentError } = await supabase
      .from("tournaments")
      .insert([
        {
          name: name.trim(),
          owner_id: user.id,
          invite_code: inviteCode,
        },
      ])
      .select()
      .single();

    if (tournamentError || !tournamentData) {
      setLoading(false);
      showToast("❌ Error al crear torneo");
      return;
    }

    const { error: memberError } = await supabase
      .from("tournament_members")
      .insert([
        {
          user_id: user.id,
          tournament_id: tournamentData.id,
          role: "owner",
        },
      ]);

    if (memberError) {
      setLoading(false);
      showToast("❌ Torneo creado, pero falló la membresía");
      return;
    }

    const { error: playerError } = await supabase
      .from("players")
      .insert([
        {
          user_id: user.id,
          tournament_id: tournamentData.id,
          display_name: profile.username,
        },
      ]);

    setLoading(false);

    if (playerError) {
      showToast("❌ Torneo creado, pero falló el jugador del torneo");
      return;
    }

    showToast(`✅ Torneo creado. Código: ${inviteCode}`);

    setTimeout(() => {
      router.replace("/");
    }, 1500);
  }

  return (
    <View style={container}>
      <BackButton />

      <Text style={title}>Crear torneo</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del torneo"
        placeholderTextColor="#94a3b8"
        style={input}
      />

      <Pressable
        onPress={handleCreateTournament}
        style={button}
        disabled={loading}
      >
        <Text style={buttonText}>
          {loading ? "Creando..." : "Crear torneo"}
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