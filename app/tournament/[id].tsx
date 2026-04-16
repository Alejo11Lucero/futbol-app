import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import BackButton from "../../components/BackButton";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchTournamentData();
    }
  }, [id, user]);

  async function fetchTournamentData() {
    if (!id || !user) return;

    setLoading(true);

    const { data: tournamentData, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, name, invite_code, owner_id, created_at")
      .eq("id", id)
      .single();

    if (tournamentError) {
      console.log("Error cargando torneo:", tournamentError.message);
      setLoading(false);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("tournament_members")
      .select("role")
      .eq("tournament_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError) {
      console.log("Error cargando rol:", memberError.message);
      setLoading(false);
      return;
    }

    setTournament(tournamentData);
    setRole(memberData.role);
    setLoading(false);
  }

  const canCreateMatch = role === "owner" || role === "admin";

  if (loading) {
    return (
      <View style={container}>
        <BackButton />
        <Text style={loadingText}>Cargando torneo...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={container}>
        <BackButton />
        <Text style={loadingText}>No se pudo cargar el torneo</Text>
      </View>
    );
  }

  return (
    <View style={container}>
      <BackButton />

      <Text style={title}>{tournament.name}</Text>

      <Text style={subtitle}>Código: {tournament.invite_code}</Text>
      <Text style={subtitle}>Tu rol: {role}</Text>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/tournament/participants",
            params: { tournamentId: tournament.id },
          })
        }
        style={button}
      >
        <Text style={buttonText}>Participantes</Text>
      </Pressable>

      {canCreateMatch && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/tournament/create-match",
              params: { tournamentId: tournament.id },
            })
          }
          style={button}
        >
          <Text style={buttonText}>Crear partido</Text>
        </Pressable>
      )}

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/tournament/ranking",
            params: { tournamentId: tournament.id },
          })
        }
        style={button}
      >
        <Text style={buttonText}>Ranking</Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/tournament/history",
            params: { tournamentId: tournament.id },
          })
        }
        style={button}
      >
        <Text style={buttonText}>Historial</Text>
      </Pressable>
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
  marginBottom: 12,
};

const subtitle = {
  color: "#cbd5e1",
  textAlign: "center" as const,
  marginBottom: 8,
};

const button = {
  backgroundColor: "#22c55e",
  padding: 15,
  borderRadius: 12,
  marginTop: 14,
  alignItems: "center" as const,
};

const buttonText = {
  color: "#000",
  fontWeight: "bold" as const,
  fontSize: 16,
};

const loadingText = {
  color: "#fff",
  textAlign: "center" as const,
};
