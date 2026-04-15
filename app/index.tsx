import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error cargando perfil:", error.message);
      return;
    }

    setUsername(data.username);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error al cerrar sesión:", error.message);
    }
  }

  return (
    <View style={container}>
      <Text style={title}>⚽ Fulbo App ⚽</Text>

      <Text style={welcome}>
        Bienvenido{username ? `, ${username}` : ""}
      </Text>

      <Pressable onPress={() => router.push("/join-tournament")} style={button}>
        <Text style={buttonText}>Buscar torneo</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/create-tournament")} style={button}>
        <Text style={buttonText}>Crear torneo</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/my-tournaments")} style={button}>
        <Text style={buttonText}>Mis torneos</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile")} style={button}>
        <Text style={buttonText}>Perfil</Text>
      </Pressable>

      <Pressable onPress={handleLogout} style={logoutButton}>
        <Text style={logoutText}>Cerrar sesión</Text>
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
  fontSize: 30,
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  marginBottom: 14,
};

const welcome = {
  color: "#cbd5e1",
  fontSize: 18,
  textAlign: "center" as const,
  marginBottom: 30,
};

const button = {
  backgroundColor: "#22c55e",
  padding: 15,
  borderRadius: 12,
  marginBottom: 14,
  alignItems: "center" as const,
};

const buttonText = {
  color: "#000",
  fontWeight: "bold" as const,
  fontSize: 16,
};

const logoutButton = {
  marginTop: 18,
  alignItems: "center" as const,
};

const logoutText = {
  color: "#f87171",
  fontWeight: "bold" as const,
};