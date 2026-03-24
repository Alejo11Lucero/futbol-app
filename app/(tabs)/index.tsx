import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function HomeScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);
  const [matchFinished, setMatchFinished] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchPlayers();
    fetchStandings();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (matchId) fetchTeams();
  }, [matchId]);

  // 🔥 auto ocultar mensaje
  useEffect(() => {
    if (message) {
      setTimeout(() => setMessage(null), 3000);
    }
  }, [message]);

  useEffect(() => {
    fetchHistory();
  }, [matchFinished]);

  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("*");
    if (data) setPlayers(data);
  }

  async function fetchStandings() {
    const { data } = await supabase
      .from("standings")
      .select(`total_points, players ( name )`)
      .order("total_points", { ascending: false });

    if (data) setStandings(data);
  }

  // ✅ CREAR PARTIDO
  async function createMatch() {
    const { data, error } = await supabase
      .from("matches")
      .insert([{ status: "pending" }])
      .select();

    if (error) {
      Alert.alert("Error", "No se pudo crear el partido");
      return;
    }

    const newMatchId = data?.[0]?.id;
    setMatchId(newMatchId);
    setMatchFinished(false);

    await supabase.from("teams_per_match").insert([
      { match_id: newMatchId, team_number: 1 },
      { match_id: newMatchId, team_number: 2 },
    ]);

    Alert.alert("✅ Partido creado", "Ya podés armar los equipos");
    setMessage("⚽ Partido creado — armá los equipos");
  }

  // ✅ AGREGAR JUGADOR
  async function addPlayerToMatch(playerId: string, teamNumber: number) {
    if (!matchId || matchFinished) return;

    const { data: existing } = await supabase
      .from("player_match")
      .select("*")
      .eq("player_id", playerId)
      .eq("match_id", matchId);

    if (existing?.length) {
      Alert.alert("Aviso", "Jugador ya agregado");
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
        player_id: playerId,
        match_id: matchId,
        team_id: teamId,
        points_earned: 0,
      },
    ]);

    fetchTeams();
  }

  // ✅ TRAER EQUIPOS
  async function fetchTeams() {
    if (!matchId) return;

    const { data } = await supabase
      .from("player_match")
      .select(`player_id, players(name), team_id`)
      .eq("match_id", matchId);

    const { data: teams } = await supabase
      .from("teams_per_match")
      .select("*")
      .eq("match_id", matchId);

    if (!data || !teams) return;

    const teamAId = teams.find((t) => t.team_number === 1)?.id;
    const teamBId = teams.find((t) => t.team_number === 2)?.id;

    setTeamA(data.filter((i) => i.team_id === teamAId));
    setTeamB(data.filter((i) => i.team_id === teamBId));
  }

  // ✅ FINALIZAR PARTIDO
  async function finishMatch(winningTeam: number) {
    if (!matchId || matchFinished) return;

    const { data } = await supabase
      .from("player_match")
      .select("id, player_id, team_id")
      .eq("match_id", matchId);

    if (!data) return;

    for (const item of data) {
      const { data: teamData } = await supabase
        .from("teams_per_match")
        .select("team_number")
        .eq("id", item.team_id)
        .single();

      if (!teamData) continue;

      const points = teamData.team_number === winningTeam ? 3 : 0;

      await supabase
        .from("matches")
        .update({
          status: "finished",
          winner_team: winningTeam,
        })
        .eq("id", matchId);

      if (points > 0) {
        await supabase.rpc("increment_points", {
          player_id_input: item.player_id,
          points_input: points,
        });
      }
    }
    setMatchFinished(true);
    fetchStandings();
    fetchHistory();
    console.log("historial:", history);

    Alert.alert("🎉 Partido finalizado");
  }

  // ✅ REINICIAR
  async function resetMatch() {
    if (!matchId) return;

    await supabase.from("player_match").delete().eq("match_id", matchId);

    setTeamA([]);
    setTeamB([]);
    setMatchFinished(false);
    setMessage("🔄 Partido reiniciado");
  }

  // ✅ HISTORIAL
  async function fetchHistory() {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .order("created_at", { ascending: false });

    console.log("HISTORY DATA:", data); // 👈 AGREGÁ ESTO

    if (error) {
      console.log("ERROR history:", error);
    } else {
      setHistory(data);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a", padding: 16 }}>
      {/* HEADER */}
      <Text
        style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        ⚽ Fulbo App
      </Text>

      {/* 🔥 MENSAJE */}
      {message && (
        <View
          style={{
            backgroundColor: "#22c55e",
            padding: 10,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text
            style={{ color: "#000", textAlign: "center", fontWeight: "bold" }}
          >
            {message}
          </Text>
        </View>
      )}

      <Pressable
        onPress={createMatch}
        style={{
          backgroundColor: "#22c55e",
          padding: 12,
          borderRadius: 10,
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#000", fontWeight: "bold" }}>Crear Partido</Text>
      </Pressable>

      {/* 🔥 ESTADO */}
      {matchId && !matchFinished && (
        <Text style={{ color: "#22c55e", marginBottom: 10 }}>
          🟢 Partido en curso
        </Text>
      )}

      {matchFinished && (
        <Text style={{ color: "#ef4444", marginBottom: 10 }}>
          🔴 Partido finalizado
        </Text>
      )}

      {/* JUGADORES */}
      <Text style={{ color: "#94a3b8", marginBottom: 10 }}>Jugadores</Text>

      {players.map((player) => (
        <View
          key={player.id}
          style={{
            backgroundColor: "#1e293b",
            padding: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", marginBottom: 8 }}>{player.name}</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              disabled={matchFinished}
              onPress={() => addPlayerToMatch(player.id, 1)}
              style={{
                flex: 1,
                backgroundColor: "#3b82f6",
                padding: 8,
                borderRadius: 8,
                alignItems: "center",
                opacity: matchFinished ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff" }}>Equipo A</Text>
            </Pressable>

            <Pressable
              disabled={matchFinished}
              onPress={() => addPlayerToMatch(player.id, 2)}
              style={{
                flex: 1,
                backgroundColor: "#ef4444",
                padding: 8,
                borderRadius: 8,
                alignItems: "center",
                opacity: matchFinished ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff" }}>Equipo B</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* EQUIPOS */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>Equipo A</Text>
          {teamA.map((p, i) => (
            <Text key={i} style={{ color: "#fff" }}>
              • {p.players.name}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "#ef4444", fontWeight: "bold" }}>Equipo B</Text>
          {teamB.map((p, i) => (
            <Text key={i} style={{ color: "#fff" }}>
              • {p.players.name}
            </Text>
          ))}
        </View>
      </View>

      {/* RESULTADO */}
      <Text style={{ color: "#94a3b8", marginTop: 20 }}>Resultado</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => finishMatch(1)}
          style={{
            flex: 1,
            backgroundColor: "#3b82f6",
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff" }}>Ganó A</Text>
        </Pressable>

        <Pressable
          onPress={() => finishMatch(2)}
          style={{
            flex: 1,
            backgroundColor: "#ef4444",
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff" }}>Ganó B</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={resetMatch}
        style={{
          marginTop: 10,
          backgroundColor: "#f59e0b",
          padding: 10,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#000" }}>Reiniciar</Text>
      </Pressable>

      {/* RANKING */}
      <Text style={{ color: "#94a3b8", marginTop: 25 }}>Ranking</Text>

      {standings.map((s, i) => (
        <View
          key={i}
          style={{
            backgroundColor: "#1e293b",
            padding: 10,
            borderRadius: 10,
            marginTop: 5,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#fff" }}>
            {i + 1}. {s.players.name}
          </Text>
          <Text style={{ color: "#22c55e", fontWeight: "bold" }}>
            {s.total_points} pts
          </Text>
        </View>
      ))}

      <Text style={{ color: "#94a3b8", marginTop: 25 }}>
        Historial de Partidos
      </Text>

      {history.map((match, index) => (
        <View
          key={match.id}
          style={{
            backgroundColor: "#1e293b",
            padding: 12,
            borderRadius: 10,
            marginTop: 5,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Partido #{index + 1}
          </Text>

          <Text style={{ color: "#94a3b8" }}>
            Fecha: {new Date(match.created_at).toLocaleDateString()}
          </Text>

          <Text style={{ color: "#fff" }}>
            Ganador: {match.winner_team === 1 ? "Equipo A 🔵" : "Equipo B 🔴"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
