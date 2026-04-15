import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function ParticipantsScreen() {
  const { tournamentId } = useLocalSearchParams();
  const { user } = useAuth();

  const [participants, setParticipants] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId && user) {
      fetchParticipants();
    }
  }, [tournamentId, user]);

  async function fetchParticipants() {
    if (!tournamentId || !user) return;

    setLoading(true);

    const { data: myMembership, error: myMembershipError } = await supabase
      .from("tournament_members")
      .select("role")
      .eq("tournament_id", tournamentId)
      .eq("user_id", user.id)
      .single();

    if (myMembershipError) {
      console.log("Error cargando rol actual:", myMembershipError.message);
      setLoading(false);
      return;
    }

    setMyRole(myMembership.role);

    const { data, error } = await supabase
      .from("tournament_members")
      .select(`
        id,
        role,
        user_id
      `)
      .eq("tournament_id", tournamentId);

    if (error) {
      console.log("Error cargando participantes:", error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const userIds = data.map((item) => item.user_id);

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    if (profilesError) {
      console.log("Error cargando perfiles:", profilesError.message);
      setLoading(false);
      return;
    }

    const merged = data.map((member) => {
      const profile = profilesData?.find((p) => p.id === member.user_id);
      return {
        ...member,
        username: profile?.username || "Sin nombre",
      };
    });

    setParticipants(merged);
    setLoading(false);
  }

  async function makeAdmin(memberId: string, currentRole: string) {
    if (myRole !== "owner") {
      Alert.alert("Error", "Solo el owner puede asignar admins");
      return;
    }

    if (currentRole !== "player") {
      Alert.alert("Aviso", "Solo podés promover jugadores");
      return;
    }

    const { error } = await supabase
      .from("tournament_members")
      .update({ role: "admin" })
      .eq("id", memberId);

    if (error) {
      Alert.alert("Error", "No se pudo actualizar el rol");
      return;
    }

    Alert.alert("Éxito", "Ahora ese participante es admin");
    fetchParticipants();
  }

  return (
    <ScrollView style={container}>
      <Text style={title}>Participantes</Text>

      {loading ? (
        <Text style={emptyText}>Cargando participantes...</Text>
      ) : participants.length === 0 ? (
        <Text style={emptyText}>No hay participantes</Text>
      ) : (
        participants.map((item) => (
          <View key={item.id} style={card}>
            <View>
              <Text style={username}>{item.username}</Text>
              <Text style={role}>Rol: {item.role}</Text>
            </View>

            {myRole === "owner" &&
              item.role === "player" &&
              item.user_id !== user?.id && (
                <Pressable
                  onPress={() => makeAdmin(item.id, item.role)}
                  style={adminButton}
                >
                  <Text style={adminButtonText}>Hacer admin</Text>
                </Pressable>
              )}
          </View>
        ))
      )}
    </ScrollView>
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
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
};

const username = {
  color: "#fff",
  fontSize: 17,
  fontWeight: "bold" as const,
};

const role = {
  color: "#cbd5e1",
  marginTop: 4,
};

const adminButton = {
  backgroundColor: "#22c55e",
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
};

const adminButtonText = {
  color: "#000",
  fontWeight: "bold" as const,
};