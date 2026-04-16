import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, Animated } from "react-native";
import { supabase } from "../../lib/supabase";
import BackButton from "../../components/BackButton";

export default function CreateTournamentMatchScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();

  const [players, setPlayers] = useState<any[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);

  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);

  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (tournamentId) {
      fetchPlayers();
      loadOrCreateMatch();
    }
  }, [tournamentId]);

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
    }, 500);
  }

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("id, display_name")
      .eq("tournament_id", tournamentId);

    if (error) {
      console.log("Error cargando players:", error.message);
      return;
    }

    setPlayers(data || []);
  }

  async function loadOrCreateMatch() {
    const storageKey = `activeMatch_${tournamentId}`;
    const saved = await AsyncStorage.getItem(storageKey);

    if (saved) {
      setMatchId(saved);
      return;
    }

    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          tournament_id: tournamentId,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.log("Error creando match:", error?.message);
      return;
    }

    setMatchId(data.id);
    await AsyncStorage.setItem(storageKey, data.id);

    await supabase.from("teams_per_match").insert([
      { match_id: data.id, team_number: 1 },
      { match_id: data.id, team_number: 2 },
    ]);
  }

  const availablePlayers = players.filter(
    (p) =>
      !teamA.find((a) => a.id === p.id) &&
      !teamB.find((b) => b.id === p.id)
  );

  async function addPlayer(player: any, teamNumber: number) {
    if (!matchId) return;

    const exists =
      teamA.find((p) => p.id === player.id) ||
      teamB.find((p) => p.id === player.id);

    if (exists) {
      showToast("Jugador ya seleccionado");
      return;
    }

    const { data: teams, error } = await supabase
      .from("teams_per_match")
      .select("*")
      .eq("match_id", matchId)
      .eq("team_number", teamNumber);

    if (error || !teams?.length) {
      console.log("Error buscando equipo:", error?.message);
      return;
    }

    const teamId = teams[0].id;

    const { error: insertError } = await supabase.from("player_match").insert([
      {
        player_id: player.id,
        match_id: matchId,
        team_id: teamId,
        points_earned: 0,
      },
    ]);

    if (insertError) {
      console.log("Error insertando player_match:", insertError.message);
      return;
    }

    if (teamNumber === 1) {
      setTeamA((prev) => [...prev, player]);
      showToast(`➕ ${player.display_name} → Equipo A`);
    } else {
      setTeamB((prev) => [...prev, player]);
      showToast(`➕ ${player.display_name} → Equipo B`);
    }
  }

  async function removePlayer(playerId: string) {
    if (!matchId) return;

    const { error } = await supabase
      .from("player_match")
      .delete()
      .eq("player_id", playerId)
      .eq("match_id", matchId);

    if (error) {
      console.log("Error eliminando player:", error.message);
      return;
    }

    setTeamA((prev) => prev.filter((p) => p.id !== playerId));
    setTeamB((prev) => prev.filter((p) => p.id !== playerId));

    showToast("Jugador eliminado");
  }

  function handleConfirm() {
    if (teamA.length === 0 || teamB.length === 0) {
      Alert.alert("Error", "Ambos equipos deben tener jugadores");
      return;
    }

    router.push({
      pathname: "/tournament/result",
      params: { matchId, tournamentId },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <BackButton />

      <ScrollView style={{ padding: 16, paddingTop: 90 }}>
        <Text style={{ color: "#fff", fontSize: 24, marginBottom: 20 }}>
          Armar equipos
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>Equipo A</Text>

            <Pressable onPress={() => setShowA(!showA)} style={btnBlue}>
              <Text style={{ color: "#fff" }}>Agregar</Text>
            </Pressable>

            {showA &&
              availablePlayers.map((p) => (
                <Pressable key={p.id} onPress={() => addPlayer(p, 1)}>
                  <Text style={dropdownItem}>{p.display_name}</Text>
                </Pressable>
              ))}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#ef4444", fontWeight: "bold" }}>Equipo B</Text>

            <Pressable onPress={() => setShowB(!showB)} style={btnRed}>
              <Text style={{ color: "#fff" }}>Agregar</Text>
            </Pressable>

            {showB &&
              availablePlayers.map((p) => (
                <Pressable key={p.id} onPress={() => addPlayer(p, 2)}>
                  <Text style={dropdownItem}>{p.display_name}</Text>
                </Pressable>
              ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>Equipo A</Text>

            {teamA.map((p) => (
              <View key={p.id} style={playerRow}>
                <Text style={{ color: "#fff" }}>{p.display_name}</Text>
                <Pressable onPress={() => removePlayer(p.id)}>
                  <Text style={{ color: "#ef4444" }}>❌</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#ef4444", fontWeight: "bold" }}>Equipo B</Text>

            {teamB.map((p) => (
              <View key={p.id} style={playerRow}>
                <Text style={{ color: "#fff" }}>{p.display_name}</Text>
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
          <Text style={{ color: "#000", fontWeight: "bold" }}>
            {toast}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

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