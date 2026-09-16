import { useAtomValue } from "jotai";
import { isLoggedInAtom } from "../store/authAtom";
import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  if (!isLoggedIn) {
    window.location.href = "/";
    return null;
  }

  return (
    <div>
      <Dashboard />
    </div>
  );
}