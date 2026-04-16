import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function MyTournamentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyTournaments();
    }
  }, [user]);

  async function fetchMyTournaments() {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("tournament_members")
      .select(
        `
        role,
        tournaments (
          id,
          name,
          invite_code,
          created_at
        )
      `,
      )
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      console.log("Error cargando torneos:", error.message);
      return;
    }

    setTournaments(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <BackButton />

      <ScrollView style={container}>
        <Text style={title}>Mis torneos</Text>

        {loading ? (
          <Text style={emptyText}>Cargando torneos...</Text>
        ) : tournaments.length === 0 ? (
          <Text style={emptyText}>Todavía no participás en ningún torneo</Text>
        ) : (
          tournaments.map((item, index) => {
            const tournament = item.tournaments;

            if (!tournament) return null;

            return (
              <Pressable
                key={index}
                onPress={() =>
                  router.push({
                    pathname: "/tournament/[id]",
                    params: { id: tournament.id },
                  })
                }
                style={card}
              >
                <Text style={cardTitle}>{tournament.name}</Text>

                <Text style={cardSubtitle}>
                  Código: {tournament.invite_code}
                </Text>

                <Text style={cardSubtitle}>Rol: {item.role}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const container = {
  flex: 1,
  backgroundColor: "#0f172a",
  padding: 16,
};

const title = {
  color: "#fff",
  fontSize: 28,
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  marginBottom: 20,
};

const emptyText = {
  color: "#94a3b8",
  textAlign: "center" as const,
  marginTop: 30,
};

const card = {
  backgroundColor: "#1e293b",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
};

const cardTitle = {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold" as const,
  marginBottom: 8,
};

const cardSubtitle = {
  color: "#cbd5e1",
  marginBottom: 4,
};
