import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import BackButton from "../../components/BackButton";
import { supabase } from "../../lib/supabase";

export default function TournamentHistoryScreen() {
  const { tournamentId } = useLocalSearchParams();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchHistory();
    }
  }, [tournamentId]);

  async function fetchHistory() {
    setLoading(true);

    const { data, error } = await supabase
      .from("matches")
      .select("id, winner_team, created_at, status")
      .eq("tournament_id", tournamentId)
      .eq("status", "finished")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.log("Error cargando historial:", error.message);
      return;
    }

    setMatches(data || []);
  }

  function getResultText(winnerTeam: number | null) {
    if (winnerTeam === 1) return "🏆 Ganó Equipo A";
    if (winnerTeam === 2) return "🏆 Ganó Equipo B";
    return "🤝 Empate";
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <BackButton />

      <ScrollView style={container}>
        <Text style={[title, { marginTop: 70 }]}>📜 Historial del torneo</Text>

        {loading ? (
          <Text style={emptyText}>Cargando historial...</Text>
        ) : matches.length === 0 ? (
          <Text style={emptyText}>Todavía no hay partidos jugados</Text>
        ) : (
          matches.map((match, index) => (
            <View key={match.id} style={card}>
              <Text style={matchTitle}>Partido #{matches.length - index}</Text>

              <Text style={matchDate}>
                {new Date(match.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                ·{" "}
                {new Date(match.created_at).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              <Text style={resultText}>{getResultText(match.winner_team)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const container = {
  flex: 1,
  backgroundColor: "#0f172a",
  padding: 16,
} as const;

const title = {
  color: "#fff",
  fontSize: 26,
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  marginBottom: 20,
} as const;

const emptyText = {
  color: "#94a3b8",
  textAlign: "center" as const,
  marginTop: 30,
} as const;

const card = {
  backgroundColor: "#1e293b",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
} as const;

const matchTitle = {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold" as const,
  marginBottom: 8,
} as const;

const matchDate = {
  color: "#94a3b8",
  marginBottom: 8,
} as const;

const resultText = {
  color: "#22c55e",
  fontWeight: "bold" as const,
} as const;
