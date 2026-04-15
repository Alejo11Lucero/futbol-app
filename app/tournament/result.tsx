import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function TournamentResultScreen() {
  const { matchId, tournamentId } = useLocalSearchParams();
  const router = useRouter();

  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<number | "draw" | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  const fetchTeams = useCallback(async () => {
    const { data } = await supabase
      .from("player_match")
      .select(`
        player_id,
        players(display_name),
        team_id
      `)
      .eq("match_id", matchId);

    const { data: teams } = await supabase
      .from("teams_per_match")
      .select("*")
      .eq("match_id", matchId);

    if (!data || !teams) return;

    const teamAId = teams.find((t) => t.team_number === 1)?.id;
    const teamBId = teams.find((t) => t.team_number === 2)?.id;

    setTeamA(data.filter((p) => p.team_id === teamAId));
    setTeamB(data.filter((p) => p.team_id === teamBId));
  }, [matchId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  async function finishMatch(result: number | "draw") {
    if (loading) return;

    setLoading(true);
    setWinner(result);

    const { data } = await supabase
      .from("player_match")
      .select("id, player_id, team_id")
      .eq("match_id", matchId);

    if (!data) {
      setLoading(false);
      return;
    }

    for (const item of data) {
      let points = 0;

      if (result === "draw") {
        points = 1;
      } else {
        const { data: teamData } = await supabase
          .from("teams_per_match")
          .select("team_number")
          .eq("id", item.team_id)
          .single();

        if (!teamData) continue;

        points = teamData.team_number === result ? 3 : 0;
      }

      await supabase
        .from("player_match")
        .update({ points_earned: points })
        .eq("id", item.id);

      if (points > 0) {
        await supabase.rpc("increment_points", {
          player_id_input: item.player_id,
          points_input: points,
        });
      }
    }

    await supabase
      .from("matches")
      .update({
        status: "finished",
        winner_team: result === "draw" ? null : result,
      })
      .eq("id", matchId);

    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 120,
        useNativeDriver: true,
      }).start(async () => {
        await AsyncStorage.removeItem(`activeMatch_${tournamentId}`);
        router.replace("/");
      });
    }, 400);
  }

  return (
    <View style={container}>
      <Text style={title}>Resultado del Partido</Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={teamCard}>
          <Text style={teamTitleBlue}>🔵 Equipo A ({teamA.length})</Text>

          {teamA.length === 0 && <Text style={emptyText}>Sin jugadores</Text>}

          {teamA.map((p, i) => (
            <View key={i} style={playerCard}>
              <Text style={playerText}>{p.players.display_name}</Text>
            </View>
          ))}
        </View>

        <View style={teamCard}>
          <Text style={teamTitleRed}>🔴 Equipo B ({teamB.length})</Text>

          {teamB.length === 0 && <Text style={emptyText}>Sin jugadores</Text>}

          {teamB.map((p, i) => (
            <View key={i} style={playerCard}>
              <Text style={playerText}>{p.players.display_name}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={subtitle}>¿Cómo terminó?</Text>

      <Pressable
        disabled={loading}
        onPress={() => finishMatch(1)}
        style={btnBlue}
      >
        <Text style={btnText}>🏆 Ganó Equipo A</Text>
      </Pressable>

      <Pressable
        disabled={loading}
        onPress={() => finishMatch(2)}
        style={btnRed}
      >
        <Text style={btnText}>🏆 Ganó Equipo B</Text>
      </Pressable>

      <Pressable
        disabled={loading}
        onPress={() => finishMatch("draw")}
        style={btnDraw}
      >
        <Text style={btnText}>🤝 Empate</Text>
      </Pressable>

      {winner && (
        <View style={overlay}>
          <Animated.View
            style={[winnerCard, { transform: [{ scale: scaleAnim }] }]}
          >
            <Text style={winnerText}>
              {winner === "draw"
                ? "🤝 ¡Empate!"
                : `🏆 Ganó el ${winner === 1 ? "Equipo A 🔵" : "Equipo B 🔴"}`}
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const container = {
  flex: 1,
  backgroundColor: "#0f172a",
  padding: 20,
} as const;

const title = {
  color: "#fff",
  fontSize: 26,
  fontWeight: "bold" as const,
  marginBottom: 20,
} as const;

const subtitle = {
  color: "#94a3b8",
  marginTop: 30,
  marginBottom: 10,
} as const;

const teamCard = {
  flex: 1,
  backgroundColor: "#111827",
  padding: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#1f2937",
} as const;

const teamTitleBlue = {
  color: "#3b82f6",
  fontWeight: "bold" as const,
  marginBottom: 10,
} as const;

const teamTitleRed = {
  color: "#ef4444",
  fontWeight: "bold" as const,
  marginBottom: 10,
} as const;

const emptyText = {
  color: "#6b7280",
  fontStyle: "italic" as const,
} as const;

const playerCard = {
  backgroundColor: "#1e293b",
  padding: 10,
  borderRadius: 8,
  marginBottom: 6,
} as const;

const playerText = {
  color: "#fff",
} as const;

const btnBlue = {
  backgroundColor: "#3b82f6",
  padding: 15,
  borderRadius: 10,
  alignItems: "center" as const,
  marginTop: 10,
} as const;

const btnRed = {
  backgroundColor: "#ef4444",
  padding: 15,
  borderRadius: 10,
  alignItems: "center" as const,
  marginTop: 10,
} as const;

const btnDraw = {
  backgroundColor: "#f59e0b",
  padding: 15,
  borderRadius: 10,
  alignItems: "center" as const,
  marginTop: 10,
} as const;

const btnText = {
  color: "#fff",
  fontWeight: "bold" as const,
} as const;

const overlay = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.8)",
  justifyContent: "center" as const,
  alignItems: "center" as const,
} as const;

const winnerCard = {
  backgroundColor: "#22c55e",
  padding: 30,
  borderRadius: 20,
} as const;

const winnerText = {
  color: "#000",
  fontSize: 22,
  fontWeight: "bold" as const,
} as const;