import { useState } from "react";
import BookingPage from "./BookingPage";
import AdminPage from "./AdminPage";

type AppView = "booking" | "admin";

export default function Index() {
  const [view, setView] = useState<AppView>("booking");

  if (view === "admin") return <AdminPage onBack={() => setView("booking")} />;
  return <BookingPage onAdminClick={() => setView("admin")} />;
}
