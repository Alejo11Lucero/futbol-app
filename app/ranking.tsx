import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function RankingScreen() {
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    fetchStandings();
  }, []);

  async function fetchStandings() {
    const { data } = await supabase
      .from("standings")
      .select(`total_points, players ( name )`)
      .order("total_points", { ascending: false });

    if (data) setStandings(data);
  }

  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);

  return (
    <ScrollView style={container}>
      <Text style={title}>🏆 Ranking</Text>

      {/* 🥇 PODIO */}
      <View style={podiumContainer}>
        {top3.map((player, index) => (
          <View key={index} style={getPodiumStyle(index)}>
            <Text style={podiumPosition}>{getMedal(index)}</Text>
            <Text style={podiumName}>{player.players.name}</Text>
            <Text style={podiumPoints}>{player.total_points} pts</Text>
          </View>
        ))}
      </View>

      {/* 📊 LISTA */}
      <View style={{ marginTop: 20 }}>
        {rest.map((player, index) => (
          <View key={index} style={row}>
            <Text style={position}>{index + 4}</Text>

            <Text style={name}>{player.players.name}</Text>

            <Text style={points}>{player.total_points} pts</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* 🧠 HELPERS */

function getMedal(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  return "🥉";
}

function getPodiumStyle(index: number) {
  const base = {
    flex: 1,
    alignItems: "center" as const,
    padding: 15,
    borderRadius: 12,
  };

  if (index === 0) return { ...base, backgroundColor: "#facc15" }; // oro
  if (index === 1) return { ...base, backgroundColor: "#9ca3af" }; // plata
  return { ...base, backgroundColor: "#b45309" }; // bronce
}

/* 🎨 ESTILOS */

const container = {
  flex: 1,
  backgroundColor: "#0f172a",
  padding: 16,
};

const title = {
  color: "#fff",
  fontSize: 26,
  fontWeight: "bold" as const,
  marginBottom: 20,
};

const podiumContainer = {
  flexDirection: "row" as const,
  gap: 10,
};

const podiumPosition = {
  fontSize: 24,
};

const podiumName = {
  color: "#000",
  fontWeight: "bold" as const,
  marginTop: 5,
};

const podiumPoints = {
  color: "#000",
  marginTop: 5,
};

const row = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  backgroundColor: "#1e293b",
  padding: 12,
  borderRadius: 10,
  marginBottom: 8,
};

const position = {
  color: "#94a3b8",
  width: 30,
};

const name = {
  color: "#fff",
  flex: 1,
};

const points = {
  color: "#22c55e",
  fontWeight: "bold" as const,
};
