import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#0f172a",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 28, marginBottom: 30 }}>
        ⚽ Fulbo App
      </Text>

      <Pressable onPress={() => router.push("/create-match")} style={btn}>
        <Text style={txt}>Crear Partido</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/ranking")} style={btn}>
        <Text style={txt}>Ranking</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/history")} style={btn}>
        <Text style={txt}>Historial</Text>
      </Pressable>
    </View>
  );
}

const btn = {
  backgroundColor: "#22c55e",
  padding: 15,
  borderRadius: 10,
  marginBottom: 15,
  alignItems: "center",
} as const;

const txt = {
  color: "#000",
  fontWeight: "bold",
} as const;
