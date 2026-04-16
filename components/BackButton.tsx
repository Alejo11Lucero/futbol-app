import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function BackButton() {
  const router = useRouter();

  return (
    <View style={container}>
      <Pressable onPress={() => router.back()} style={button}>
        <Text style={icon}>←</Text>
      </Pressable>
    </View>
  );
}

const container = {
  position: "absolute" as const,
  top: 50,
  left: 20,
  zIndex: 20,
};

const button = {
  backgroundColor: "#1e293b",
  width: 38,
  height: 38,
  borderRadius: 12,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
};

const icon = {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold" as const,
};