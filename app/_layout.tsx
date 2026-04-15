import { Redirect, Slot, usePathname } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { Text, View } from "react-native";

function RootNavigator() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>Cargando...</Text>
      </View>
    );
  }

  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // 🔒 Si NO hay usuario y NO está en login/register → mandar a login
  if (!user && !isAuthRoute) {
    return <Redirect href="/login" />;
  }

  // 🔓 Si HAY usuario y está en login/register → mandar al home
  if (user && isAuthRoute) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}