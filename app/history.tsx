import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function History() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .order("created_at", { ascending: false });

    if (data) setHistory(data);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a", padding: 16 }}>
<Text style={title}>📖 Historial 📖</Text>

      {history.map((match, i) => (
        <View
          key={match.id}
          style={{
            backgroundColor: "#1e293b",
            padding: 10,
            marginBottom: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff" }}>Partido #{i + 1}</Text>

          <Text style={{ color: "#94a3b8" }}>
            {new Date(match.created_at).toLocaleDateString()}
          </Text>

          <Text style={{ color: "#fff" }}>
            Ganador: {match.winner_team === 1 ? "Equipo A" : "Equipo B"}
          </Text>
        </View>
      ))}
    </ScrollView>
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