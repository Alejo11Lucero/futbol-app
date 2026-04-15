import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function TournamentRankingScreen() {
  const { tournamentId } = useLocalSearchParams();
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchStandings();
    }
  }, [tournamentId]);

  async function fetchStandings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("standings")
      .select(`
        total_points,
        players (
          display_name
        )
      `)
      .eq("tournament_id", tournamentId)
      .order("total_points", { ascending: false });

    setLoading(false);

    if (error) {
      console.log("Error cargando ranking:", error.message);
      return;
    }

    setStandings(data || []);
  }

  const first = standings[0];
  const second = standings[1];
  const third = standings[2];
  const rest = standings.slice(3);

  return (
    <ScrollView style={container}>
      <Text style={title}>🏆 Ranking del torneo 🏆</Text>

      {loading ? (
        <Text style={emptyText}>Cargando ranking...</Text>
      ) : standings.length === 0 ? (
        <Text style={emptyText}>Todavía no hay puntos en este torneo</Text>
      ) : (
        <>
          {/* 🥇 PRIMER PUESTO */}
          {first && (
            <View style={firstContainer}>
              <Text style={medal}>🥇</Text>
              <Text style={firstName}>{first.players.display_name}</Text>
              <Text style={firstPoints}>{first.total_points} pts</Text>
            </View>
          )}

          {/* 🥈🥉 SEGUNDO Y TERCERO */}
          <View style={secondThirdContainer}>
            {second && (
              <View style={secondCard}>
                <Text style={medal}>🥈</Text>
                <Text style={name}>{second.players.display_name}</Text>
                <Text style={points}>{second.total_points} pts</Text>
              </View>
            )}

            {third && (
              <View style={thirdCard}>
                <Text style={medal}>🥉</Text>
                <Text style={name}>{third.players.display_name}</Text>
                <Text style={points}>{third.total_points} pts</Text>
              </View>
            )}
          </View>

          {/* 📊 RESTO */}
          <View style={{ marginTop: 30 }}>
            {rest.map((player, index) => (
              <View key={index} style={row}>
                <Text style={position}>{index + 4}</Text>
                <Text style={name}>{player.players.display_name}</Text>
                <Text style={points}>{player.total_points} pts</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/* 🎨 ESTILOS */

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

/* 🥇 */
const firstContainer = {
  alignItems: "center" as const,
  backgroundColor: "#facc15",
  padding: 20,
  borderRadius: 16,
} as const;

const firstName = {
  color: "#000",
  fontSize: 18,
  fontWeight: "bold" as const,
  marginTop: 5,
} as const;

const firstPoints = {
  color: "#000",
  marginTop: 5,
} as const;

/* 🥈🥉 */
const secondThirdContainer = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  marginTop: 20,
  gap: 10,
} as const;

const secondCard = {
  flex: 1,
  backgroundColor: "#9ca3af",
  padding: 15,
  borderRadius: 12,
  alignItems: "center" as const,
} as const;

const thirdCard = {
  flex: 1,
  backgroundColor: "#b45309",
  padding: 15,
  borderRadius: 12,
  alignItems: "center" as const,
} as const;

const medal = {
  fontSize: 24,
} as const;

const name = {
  color: "#fff",
  marginTop: 5,
  fontWeight: "bold" as const,
  textAlign: "center" as const,
} as const;

const points = {
  color: "#22c55e",
  fontWeight: "bold" as const,
  marginTop: 5,
} as const;

/* 📊 RESTO */
const row = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  backgroundColor: "#1e293b",
  padding: 14,
  borderRadius: 12,
  marginBottom: 10,
} as const;

const position = {
  color: "#94a3b8",
  width: 30,
  fontWeight: "bold" as const,
} as const;