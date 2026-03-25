import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function CreateMatch() {
  const [players, setPlayers] = useState<any[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);

  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);

  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();

  useEffect(() => {
    fetchPlayers();
    loadOrCreateMatch();
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("*");
    if (data) setPlayers(data);
  }

  async function loadOrCreateMatch() {
    const saved = await AsyncStorage.getItem("activeMatch");

    if (saved) {
      setMatchId(saved);
      return;
    }

    const { data } = await supabase
      .from("matches")
      .insert([{ status: "pending" }])
      .select();

    const newMatchId = data?.[0]?.id;
    setMatchId(newMatchId);

    await AsyncStorage.setItem("activeMatch", newMatchId);

    await supabase.from("teams_per_match").insert([
      { match_id: newMatchId, team_number: 1 },
      { match_id: newMatchId, team_number: 2 },
    ]);
  }

  // 🔥 PLAYERS DISPONIBLES
  const availablePlayers = players.filter(
    (p) =>
      !teamA.find((a) => a.id === p.id) && !teamB.find((b) => b.id === p.id),
  );

  // 🔥 TOAST
  function showToast(message: string) {
    setToast(message);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 650);
  }

  // 🔥 AGREGAR JUGADOR
  async function addPlayer(player: any, teamNumber: number) {
    if (!matchId) return;

    const exists =
      teamA.find((p) => p.id === player.id) ||
      teamB.find((p) => p.id === player.id);

    if (exists) {
      showToast("Jugador ya seleccionado");
      return;
    }

    const { data: teams } = await supabase
      .from("teams_per_match")
      .select("*")
      .eq("match_id", matchId)
      .eq("team_number", teamNumber);

    const teamId = teams?.[0]?.id;

    await supabase.from("player_match").insert([
      {
        player_id: player.id,
        match_id: matchId,
        team_id: teamId,
        points_earned: 0,
      },
    ]);

    if (teamNumber === 1) {
      setTeamA((prev) => [...prev, player]);
      showToast(`➕ ${player.name} → Equipo A`);
    } else {
      setTeamB((prev) => [...prev, player]);
      showToast(`➕ ${player.name} → Equipo B`);
    }
  }

  // 🔥 ELIMINAR JUGADOR
  async function removePlayer(playerId: string) {
    await supabase
      .from("player_match")
      .delete()
      .eq("player_id", playerId)
      .eq("match_id", matchId);

    setTeamA(teamA.filter((p) => p.id !== playerId));
    setTeamB(teamB.filter((p) => p.id !== playerId));

    showToast("Jugador eliminado");
  }

  // 🔥 CONFIRMAR
  function handleConfirm() {
    if (teamA.length === 0 || teamB.length === 0) {
      Alert.alert("Error", "Ambos equipos deben tener jugadores");
      return;
    }

    router.push({
      pathname: "/result",
      params: { matchId },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView style={{ padding: 16 }}>
        <Text style={title}>🍞 Armar equipos 🧀</Text>

        {/* SELECTORES */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* EQUIPO A */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>
              Equipo A
            </Text>

            <Pressable onPress={() => setShowA(!showA)} style={btnBlue}>
              <Text style={{ color: "#fff" }}>Agregar</Text>
            </Pressable>

            {showA &&
              availablePlayers.map((p) => (
                <Pressable key={p.id} onPress={() => addPlayer(p, 1)}>
                  <Text style={dropdownItem}>{p.name}</Text>
                </Pressable>
              ))}
          </View>

          {/* EQUIPO B */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
              Equipo B
            </Text>

            <Pressable onPress={() => setShowB(!showB)} style={btnRed}>
              <Text style={{ color: "#fff" }}>Agregar</Text>
            </Pressable>

            {showB &&
              availablePlayers.map((p) => (
                <Pressable key={p.id} onPress={() => addPlayer(p, 2)}>
                  <Text style={dropdownItem}>{p.name}</Text>
                </Pressable>
              ))}
          </View>
        </View>

        {/* LISTAS */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>
              Equipo A
            </Text>

            {teamA.map((p) => (
              <View key={p.id} style={playerRow}>
                <Text style={{ color: "#fff" }}>{p.name}</Text>
                <Pressable onPress={() => removePlayer(p.id)}>
                  <Text style={{ color: "#ef4444" }}>❌</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
              Equipo B
            </Text>

            {teamB.map((p) => (
              <View key={p.id} style={playerRow}>
                <Text style={{ color: "#fff" }}>{p.name}</Text>
                <Pressable onPress={() => removePlayer(p.id)}>
                  <Text style={{ color: "#ef4444" }}>❌</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <Pressable onPress={handleConfirm} style={btnGreen}>
          <Text style={{ color: "#000", fontWeight: "bold" }}>
            Confirmar equipos
          </Text>
        </Pressable>
      </ScrollView>

      {/* 🔥 TOAST */}
      {toast && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 40,
            alignSelf: "center",
            backgroundColor: "#22c55e",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            opacity: fadeAnim,
          }}
        >
          <Text style={{ color: "#000", fontWeight: "bold" }}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const title = {
  color: "#fff",
  fontSize: 26,
  fontWeight: "bold" as const,
  marginBottom: 20,
  textAlign: "center" as const,
  letterSpacing: 1,
};

const btnBlue = {
  backgroundColor: "#3b82f6",
  padding: 10,
  borderRadius: 8,
  marginTop: 10,
  alignItems: "center" as const,
};

const btnRed = {
  backgroundColor: "#ef4444",
  padding: 10,
  borderRadius: 8,
  marginTop: 10,
  alignItems: "center" as const,
};

const btnGreen = {
  backgroundColor: "#22c55e",
  padding: 15,
  borderRadius: 10,
  marginTop: 30,
  alignItems: "center" as const,
};

const dropdownItem = {
  color: "#fff",
  padding: 10,
  backgroundColor: "#1e293b",
  marginTop: 5,
  borderRadius: 6,
};

const playerRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  backgroundColor: "#1e293b",
  padding: 10,
  borderRadius: 8,
  marginTop: 5,
};
